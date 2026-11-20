// 대화 상대·나의 동그란 얼굴 (말풍선 옆). 단순한 선 그림으로 직접 그렸어요
// 대화마다 얼굴: FACE_OF (없으면 기본). 새 대화를 만들면 여기에 이어서 적어요

const N = '#24324A';
const SKIN = '#F6D2B4';

/** hair: 머리 모양, hc: 머리색, glasses, beard(콧수염), cap, bg: 동그라미 배경 */
const FACES = {
  auntie: { hair: 'curly', hc: '#7A4B35', bg: '#FFE1DB' },
  auntie2: { hair: 'curly', hc: '#3B2E2A', bg: '#FFF3D6', glasses: true },
  youngW: { hair: 'long', hc: '#2E2A33', bg: '#DDF3EF' },
  youngW2: { hair: 'pony', hc: '#5A3B2B', bg: '#FFF3D6' },
  bob: { hair: 'bob', hc: '#2E2A33', bg: '#FFE1DB' },
  youngM: { hair: 'short', hc: '#2E2A33', bg: '#DDF3EF' },
  office: { hair: 'side', hc: '#2E2A33', bg: '#E4EEF8', glasses: true },
  office2: { hair: 'side', hc: '#4A3426', bg: '#E4EEF8' },
  grandma: { hair: 'bun', hc: '#C9C4BC', bg: '#FFF3D6' },
  grandpa: { hair: 'bald', hc: '#FFFFFF', bg: '#E4EEF8', glasses: true, beard: true },
  master: { hair: 'slick', hc: '#3B2E2A', bg: '#FFF3D6', beard: true },
  driver: { hair: 'short', hc: '#2E2A33', bg: '#E4EEF8', cap: true },
  host: { hair: 'towel', hc: '#5A5A5A', bg: '#DDF3EF' },
  clerk: { hair: 'short', hc: '#5A3B2B', bg: '#FFF3D6' },
  chef: { hair: 'towel', hc: '#2E2A33', bg: '#FFE1DB', beard: true },
  auntie3: { hair: 'bun', hc: '#4A3426', bg: '#DDF3EF', glasses: true },
  staff: { hair: 'pony', hc: '#2E2A33', bg: '#E4EEF8' },
  student: { hair: 'long', hc: '#5A3B2B', bg: '#FFE1DB' },
  me: { hair: 'me', hc: N, bg: '#FFE1DB' },
};

export const FACE_OF = {
  plane: 'auntie', guesthouse: 'youngW', izakaya: 'office', onsen: 'grandma', shinkansen: 'youngM', park: 'grandpa',
  bar: 'master', taxi: 'driver', festival: 'auntie2', farewell: 'host',
  izakaya2: 'office', guesthouse2: 'youngW2', onsen2: 'grandpa', bar2: 'bob', shinkansen2: 'office2', park2: 'youngW',
  konbini: 'clerk', photo: 'youngM', ramen: 'chef', busstop: 'auntie3', hotel: 'staff', laundry: 'student',
  gate: 'office2', cafe: 'youngW2', hairsalon: 'bob', platform: 'office',
};

function hairBack(f) {
  if (f.hair === 'long') return <path d="M9 22c0-10 6-15 13-15s13 5 13 15v14H9z" fill={f.hc} stroke={N} strokeWidth="1.8" strokeLinejoin="round" />;
  if (f.hair === 'bob') return <path d="M9 22c0-10 6-15 13-15s13 5 13 15v7H9z" fill={f.hc} stroke={N} strokeWidth="1.8" strokeLinejoin="round" />;
  if (f.hair === 'bun') return <circle cx="22" cy="6.5" r="5" fill={f.hc} stroke={N} strokeWidth="1.8" />;
  if (f.hair === 'pony') return <path d="M31 14c6 2 7 10 4 16" fill="none" stroke={f.hc} strokeWidth="5" strokeLinecap="round" />;
  return null;
}

function hairFront(f) {
  switch (f.hair) {
    case 'curly':
      return <path d="M10 20c-2-7 3-12 7-11c2-4 8-4 10 0c4-1 8 4 7 11c-3-2-5-4-6-6c-2 3-7 4-12 2c-2 2-4 3-6 4z" fill={f.hc} stroke={N} strokeWidth="1.8" strokeLinejoin="round" />;
    case 'long':
    case 'bob':
    case 'pony':
      return <path d="M10 21c0-8 5-13 12-13s12 5 12 13c-5-1-9-4-11-8c-2 4-7 7-13 8z" fill={f.hc} stroke={N} strokeWidth="1.8" strokeLinejoin="round" />;
    case 'short':
      return <path d="M10 19c0-7 5-11 12-11s12 4 12 11c-4 0-8-2-10-4c-3 2-8 4-14 4z" fill={f.hc} stroke={N} strokeWidth="1.8" strokeLinejoin="round" />;
    case 'side':
      return <path d="M10 20c0-8 5-12 12-12s12 4 12 12c-6 0-11-3-13-7c-1 3-6 6-11 7z" fill={f.hc} stroke={N} strokeWidth="1.8" strokeLinejoin="round" />;
    case 'slick':
      return <path d="M10 18c1-6 6-10 12-10s11 4 12 10c-7-3-17-3-24 0z" fill={f.hc} stroke={N} strokeWidth="1.8" strokeLinejoin="round" />;
    case 'bun':
      return <path d="M10 20c0-7 5-11 12-11s12 4 12 11c-4-3-8-5-12-5s-8 2-12 5z" fill={f.hc} stroke={N} strokeWidth="1.8" strokeLinejoin="round" />;
    case 'bald':
      return (
        <>
          <path d="M8.5 23c-1-4 1-7 4-7l.5 7z" fill={f.hc} stroke={N} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M35.5 23c1-4-1-7-4-7l-.5 7z" fill={f.hc} stroke={N} strokeWidth="1.5" strokeLinejoin="round" />
        </>
      );
    case 'towel':
      return (
        <>
          <path d="M10 19c0-7 5-11 12-11s12 4 12 11c-4 0-8-2-10-4c-3 2-8 4-14 4z" fill={f.hc} stroke={N} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9.5 15.5c8-3 17-3 25 0v3.5c-8-3-17-3-25 0z" fill="#fff" stroke={N} strokeWidth="1.6" strokeLinejoin="round" />
        </>
      );
    case 'me':
      return <path d="M10 21c0-9 5-14 12-14s12 5 12 14c-5 0-9-2-11-6c-2 4-7 6-13 6z" fill={f.hc} stroke={N} strokeWidth="1.8" strokeLinejoin="round" />;
    default:
      return null;
  }
}

/** 동그란 얼굴. talking = 입을 벌리고 있어요 */
export default function Face({ kind = 'auntie', size = 40, talking = false }) {
  const f = FACES[kind] || FACES.auntie;
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true" className="face" style={{ flexShrink: 0 }}>
      <circle cx="22" cy="22" r="21" fill={f.bg} stroke={N} strokeWidth="2" />
      {hairBack(f)}
      <circle cx="22" cy="23" r="12.5" fill={SKIN} stroke={N} strokeWidth="1.8" />
      {hairFront(f)}
      {f.cap && <path d="M9.5 17c1-7 6-10 12.5-10s11.5 3 12.5 10zM8 17h28" fill="#6BB8E8" stroke={N} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />}
      {f.glasses ? (
        <>
          <circle cx="17.5" cy="23" r="3.4" fill="none" stroke={N} strokeWidth="1.5" />
          <circle cx="26.5" cy="23" r="3.4" fill="none" stroke={N} strokeWidth="1.5" />
          <path d="M21 23h2" stroke={N} strokeWidth="1.5" />
        </>
      ) : null}
      <circle cx="17.5" cy="23" r="1.3" fill={N} />
      <circle cx="26.5" cy="23" r="1.3" fill={N} />
      {f.beard && <path d="M17.5 28.5c2.5-1.6 6.5-1.6 9 0c-1.6 1.4-7.4 1.4-9 0z" fill={f.hair === 'bald' ? '#fff' : f.hc} stroke={N} strokeWidth="1.3" strokeLinejoin="round" />}
      {talking ? (
        <ellipse className="face-mouth" cx="22" cy="31" rx="2.4" ry="1.9" fill={N} />
      ) : (
        <path d="M19.5 30.5q2.5 1.8 5 0" fill="none" stroke={N} strokeWidth="1.5" strokeLinecap="round" />
      )}
    </svg>
  );
}
