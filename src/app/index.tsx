import { Redirect } from 'expo-router';
// Temporary entry point for your branch; restore the team home screen on integration.
export default function Index() { return <Redirect href="/workout/details" />; }
