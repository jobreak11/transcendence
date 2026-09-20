"use client";

import { UserProfile } from './user_profile_windows';
import { Friend_Trophieslist } from './friend&trophies'

export default function user_profile_page(){
	return (
		<div className="min-h-screen bg-black">
			<UserProfile />
			<Friend_Trophieslist />
		</div>
	)
}