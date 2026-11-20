// 안내 팝업 두 가지: 처음 온 사람 안내(6장) · 게임 방법(3장)
// 그림과 움직임은 시안 그대로 (guideArt.js + styles.css 의 .in-* · .gi-*)
import { useEffect, useRef, useState } from 'react';
import { INTRO_ART, GAME_ART } from './guideArt.js';

export const INTRO = [
  { t: '옆 사람과 스몰토크하려고 만들었어요', b: '일본 여행에서 옆자리 사람이 말을 걸어올 때, 알아듣고 짧게 대답하는 연습을 해요.', art: INTRO_ART[0] },
  { t: '목표는 적당한 스몰토크예요', b: '최종 목표는 현지인 같은 대화지만, 우리가 먼저 갈 곳은 부담 없는 스몰토크예요.', art: INTRO_ART[1] },
  { t: '오로지 대화에만 집중해요', b: '듣고 말하며 주고받을수록 대화 능력이 한 층씩 쌓여요. 문법보다 단어가 먼저예요.', art: INTRO_ART[2] },
  { t: '읽기 공부는 하지 않아요', b: '글자를 외우거나 읽는 시험이 없어요. 상대 말은 한글 발음으로 보여 줘요.', art: INTRO_ART[3] },
  { t: '그럼 글자를 읽고 싶을 땐요?', b: '메뉴판이나 안내문 같은 거요!', art: INTRO_ART[4] },
  { t: '그건 번역 앱에 맡기세요', b: '메뉴판은 사진 번역 앱이나 AI에게 찍어서 물어보면 돼요. 우리는 글자를 읽어 주지 않아요.', art: INTRO_ART[5] },
];
export const GAME = [
  { t: '브릭이 내 대답을 보여 줘요', b: '알아들은 상대 말은 민트 브릭, 딱 맞는 대답은 반짝이는 브릭으로 쌓여요. 힌트를 쓰거나 어색한 대답을 고르면 살짝 비뚤게, 대답을 두 번 튕기면 그 브릭은 못 쌓고 넘어가요.', art: GAME_ART[0] },
  { t: '어려울수록 브릭이 얇아져요', b: '레벨이 오르면 대화가 어려워지고 브릭은 얇고 작아져요. 얇은 브릭이 높이 쌓일수록 고수예요.', art: GAME_ART[1] },
  { t: '이렇게 해요', b: '상대 말을 듣고 맞는 뜻 브릭을 끼운 다음, 하고 싶은 대답을 골라 쌓아요. 맞는 대답은 여러 개일 수 있어요.', art: GAME_ART[2] },
];

export function Guide({ slides, label, doneLabel, onDone, skipLabel = '건너뛰기' }) {
  const [i, setI] = useState(0);
  const artRef = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const el = artRef.current;
      if (!el) return;
      setScale(Math.min(1, el.clientWidth / 310, el.clientHeight / 250));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  const s = slides[i];
  const last = i === slides.length - 1;
  return (
    <>
      <div className="dim" aria-hidden="true" />
      <div className="guide" role="dialog" aria-modal="true" aria-labelledby="guide-title">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="small muted">
            {label} · {i + 1}/{slides.length}
          </span>
          <button className="link-btn" onClick={onDone}>{skipLabel}</button>
        </div>
        <div className="guide-art" ref={artRef}>
          <div key={i} style={{ transform: `scale(${scale})`, transformOrigin: '50% 50%', lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: s.art }} />
        </div>
        <h2 id="guide-title">{s.t}</h2>
        <p>{s.b}</p>
        <div className="dots" aria-hidden="true">
          {slides.map((_, j) => <span key={j} className={j === i ? 'on' : ''} />)}
        </div>
        <div className="guide-foot">
          <button className="link-btn" style={{ visibility: i ? 'visible' : 'hidden' }} onClick={() => setI(i - 1)}>이전</button>
          {last ? (
            <button className="ob-btn coral" style={{ minWidth: 170 }} onClick={onDone}><span className="t">{doneLabel}</span></button>
          ) : (
            <button className="ob-btn coral" style={{ minWidth: 140 }} onClick={() => setI(i + 1)}><span className="t">다음</span></button>
          )}
        </div>
      </div>
    </>
  );
}
