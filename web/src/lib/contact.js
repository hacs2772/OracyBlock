// 문의 창 열기 (어느 화면에서든). 창은 components/Contact.jsx 가 그려요
let opener = null;
export const setContactOpener = (fn) => {
  opener = fn;
};
export const openContact = () => opener?.(true);
