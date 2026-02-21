export const OPEN_MODAL = 'OPEN_MODAL';
export const CLOSE_MODAL = 'CLOSE_MODAL';

export const openModal = (modalName: string, payload?: any) => ({
  type: OPEN_MODAL,
  payload: { modalName, payload },
});

export const closeModal = () => ({
  type: CLOSE_MODAL,
});
