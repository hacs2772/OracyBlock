-- V12: 꾸미기는 자리(꼭대기·받침판·배경)마다 하나만 (concept 11-38)
-- 예전에는 깃발과 초롱을 같이 켤 수 있었는데 탑에는 초롱만 보였어요. 둘 다 켜져 있으면 초롱만 남겨요
UPDATE inventory SET equipped = false
WHERE item = 'flag' AND equipped
  AND owner IN (SELECT owner FROM inventory WHERE item = 'lantern' AND equipped);
