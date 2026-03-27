import React, { createContext, useReducer, useContext } from 'react';
import { modalReducer, ModalState } from './reducer';

interface ModalContextProps {
  state: ModalState;
  dispatch: React.Dispatch<any>;
}

const ModalContext = createContext<ModalContextProps | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(modalReducer, { openModal: null });

  return (
    <ModalContext.Provider value={{ state, dispatch }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
