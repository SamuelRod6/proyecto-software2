// reducer.ts
import { REFRESH_NOTIFICATIONS, MARK_AS_READ } from './actions';

export interface Notification {
  id: number;
  type: string;
  title: string;
  read: boolean;
  eventName?: string;
  description?: string;
  newDates?: { date: string; label: string }[];
  eventId?: number;
  content?: string;
}

export interface NotificationState {
  notifications: Notification[];
}

export const initialState: NotificationState = {
  notifications: [],
};

export function notificationReducer(state: NotificationState, action: any): NotificationState {
  switch (action.type) {
    case REFRESH_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
      };
    case MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
    default:
      return state;
  }
}
