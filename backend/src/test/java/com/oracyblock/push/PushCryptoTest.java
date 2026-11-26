package com.oracyblock.push;

import static org.junit.jupiter.api.Assertions.*;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.SecureRandom;
import java.security.Security;
import java.util.Base64;

import nl.martijndwars.webpush.Encoding;
import nl.martijndwars.webpush.Notification;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.util.EntityUtils;
import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.interfaces.ECPrivateKey;
import org.bouncycastle.jce.interfaces.ECPublicKey;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.util.BigIntegers;
import org.junit.jupiter.api.Test;

/**
 * 휴대폰 알림의 암호화 · 서명이 실제로 되는지 (서버 열쇠를 PushService.publicKey()와 같은 방법으로 만들어서).
 * 암호 부품(bcprov)이나 web-push 판을 올렸을 때 알림이 조용히 안 가는 걸 막아요. 인터넷으로 보내지는 않아요
 */
class PushCryptoTest {
    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();

    private static KeyPair p256() throws Exception {
        KeyPairGenerator g = KeyPairGenerator.getInstance("ECDH", BouncyCastleProvider.PROVIDER_NAME);
        g.initialize(ECNamedCurveTable.getParameterSpec("prime256v1"));
        return g.generateKeyPair();
    }

    @Test
    void encryptsAndSignsLikeTheServer() throws Exception {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) Security.addProvider(new BouncyCastleProvider());
        // 서버 열쇠 (PushService.publicKey()와 같은 모양: 공개 65바이트, 비밀 32바이트)
        KeyPair server = p256();
        String pub = B64.encodeToString(((ECPublicKey) server.getPublic()).getQ().getEncoded(false));
        String priv = B64.encodeToString(BigIntegers.asUnsignedByteArray(32, ((ECPrivateKey) server.getPrivate()).getD()));
        nl.martijndwars.webpush.PushService sender = new nl.martijndwars.webpush.PushService(pub, priv, "https://oracyblock.com");

        // 휴대폰 쪽 구독 열쇠
        KeyPair phone = p256();
        byte[] auth = new byte[16];
        new SecureRandom().nextBytes(auth);
        String phonePub = B64.encodeToString(((ECPublicKey) phone.getPublic()).getQ().getEncoded(false));
        byte[] payload = "{\"title\":\"OracyBlock\",\"body\":\"오늘 밤까지 안 하면 브릭이 떨어져요\"}".getBytes(StandardCharsets.UTF_8);

        Notification n = new Notification("https://fcm.googleapis.com/fcm/send/test", phonePub, B64.encodeToString(auth), payload);
        HttpPost post = sender.preparePost(n, Encoding.AES128GCM);

        String authz = post.getFirstHeader("Authorization").getValue();
        assertTrue(authz.startsWith("vapid t="), "VAPID 서명이 붙어야 해요: " + authz);
        assertTrue(authz.contains(", k=" + pub), "서버 공개 열쇠가 같이 가야 해요");
        assertEquals("aes128gcm", post.getFirstHeader("Content-Encoding").getValue());
        byte[] body = EntityUtils.toByteArray(post.getEntity());
        assertTrue(body.length > payload.length, "암호화된 내용은 원래보다 길어요");
        assertFalse(new String(body, StandardCharsets.ISO_8859_1).contains("OracyBlock"), "내용이 그대로 보이면 안 돼요");
    }
}
