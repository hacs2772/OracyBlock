// 쌓는 속도: 하루에 얼마나 쌓을지. 레벨(얼마나 어렵게)과는 따로예요
export const SPEEDS = {
  slow: { label: '느긋하게', bricks: 1, pre: 3, review: 5, time: '하루 5분쯤' },
  normal: { label: '보통', bricks: 3, pre: 3, review: 10, time: '하루 15분쯤' },
  fast: { label: '빠르게', bricks: 5, pre: 5, review: 20, time: '하루 30분쯤' },
};
export const SPEED_KEYS = ['slow', 'normal', 'fast'];
export const speedOf = (k) => SPEEDS[k] || SPEEDS.normal;
