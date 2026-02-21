import { OPEN_MODAL, CLOSE_MODAL } from './actions';
export interface ModalState {
  openModal: string | null;
  payload?: any;
}

const initialState: ModalState = {
  openModal: null,
  payload: undefined,
};

export const modalReducer = (state = initialState, action: any): ModalState => {
  switch (action.type) {
    case OPEN_MODAL:
      if (typeof action.payload === 'object' && action.payload !== null && action.payload.modalName) {
        return {
          openModal: action.payload.modalName,
          payload: action.payload.payload,
        };
      } else {
        return {
          openModal: action.payload,
          payload: undefined,
        };
      }
    case CLOSE_MODAL:
      return { openModal: null, payload: undefined };
    default:
      return state;
  }
};
