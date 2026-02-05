import { Route } from "react-router-dom";
// screens
import EventsListScreen from "../screens/events/EventsListScreen";
import EventDetailScreen from "../screens/events/EventDetailScreen";
import EventCreateScreen from "../screens/events/EventCreateScreen";

export const eventRoutes = (
	<>
		<Route path="events" element={<EventsListScreen />} />
		<Route path="events/new" element={<EventCreateScreen />} />
		<Route path="events/:eventId" element={<EventDetailScreen />} />
	</>
);
