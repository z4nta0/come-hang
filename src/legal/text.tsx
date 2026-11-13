


/**
 * text.tsx = Legal Text
 *
 * @summary
 * The Privacy Policy and the Terms of Service themselves, each a component
 * holding its document's body, so the text lives in one place. The build
 * renders them into the static /privacy and /terms pages, and Settings shows
 * them in a sheet. Each body opens below the document's title, which its
 * container supplies, with sections as h2 headings and subsections as h3.
 * The build loads this file outside the browser, so it imports nothing.
 *
 * Sections:
 *  - Components
 *  - Exports
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
*/



// #region Components

// #region PriPolCom

/**
 * PriPolCom = Privacy Policy Component
 *
 * @summary
 * Renders the Privacy Policy's body: the date it was last updated, then its
 * sections, in a fragment, so the static page and the Settings sheet can each
 * place it under a title of their own.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The policy's body.
 *
 * @example
 * ```tsx
 * PriPolCom({}) // => <PriPolCom />
 * ```
 *
*/

function PriPolCom () : React.JSX.Element {


	return (


		<>{ /* What: Privacy Policy Fragment. Why: The policy's headings, paragraphs, and lists have to render as one child of whatever holds them. How: This groups them without adding an element. */ }


			<p>Last updated November 12, 2026</p>{ /* What: Updated Date Paragraph Element. Why: A reader should know which version they're reading. How: This gives the date of the last change. */ }

			<p>Come Hang is an app for planning get-togethers with a group. It's made and run by Gary S. Walton, an individual based in Missouri, in the United States ("we" and "us" below). This policy explains what information Come Hang handles, why, who else handles it, how long it's kept, and the choices you have. If you have a question, write to <a href='mailto:support@comehang.app'>support@comehang.app</a>.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>The short version</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }



			<ul>{ /* What: Body List Element. Why: Related points read more easily as a list. How: This holds them. */ }


				<li>You don't sign up. The app makes an anonymous identity on your device the first time you start or join a group.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>What you write and share in a group, such as messages, events, photos, your name and profile photo in the group, and your location, is encrypted on your device before it's sent, so we can't read it.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>Some details have to stay readable for the app to work, such as your group's name, who's in it, and when messages were sent. They're listed below.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>We don't sell your information, show ads, or use analytics or tracking.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>Information is kept only as long as the app needs it, and most of it deletes itself.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }


			</ul>



			<h2>What we collect and why</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<h3>Your identity</h3>{ /* What: Subsection Heading Element. Why: A section's topics read under titles of their own. How: This names one. */ }

			<p>The first time you start or join a group, the app signs your device in anonymously through Firebase Authentication, which gives it a random ID, and makes a pair of encryption keys on your device. The private key never leaves your device. The public key is stored with your ID, so other members can share a group's key with you. We also keep a record of which groups you own or belong to, and whether you've bought the upgrade.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h3>What you share in a group</h3>{ /* What: Subsection Heading Element. Why: A section's topics read under titles of their own. How: This names one. */ }

			<p>Chat messages, events and their bring-lists, photos, the name and profile photo you use in each group, and your location are encrypted on your device, with a key only the group's members hold, before they're sent to our servers. We store them, but we can't read them.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h3>What stays readable</h3>{ /* What: Subsection Heading Element. Why: A section's topics read under titles of their own. How: This names one. */ }

			<p>To deliver messages, check who may do what, and delete information on time, some details are stored without that encryption:</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }



			<ul>{ /* What: Body List Element. Why: Related points read more easily as a list. How: This holds them. */ }


				<li>a group's name, which people see when they open its invite link, and its settings, such as how long the server keeps chat</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>the code in a group's invite link</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>who belongs to each group and who owns it, when each member joined, the color the app gives each member, and the last day each member opened the app, which is used only to let members take over a group whose owner has been away for 30 days</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>who sent each message and when, and which members haven't received it yet</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>each event's start and end times, who planned it, and who has claimed each item on its bring-list</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>who shared each photo and when, the size of its file, and how many photos each member has added to an event</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>whether a member has the app open right now</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>the name and note you type when you ask to join a group, which its members read before letting you in. They're deleted once a member lets you in or declines, or after 7 days, and once you're in, your name is stored encrypted like everything else.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>the notices the app shows you, such as a group being deleted</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }


			</ul>



			<h3>Your location</h3>{ /* What: Subsection Heading Element. Why: A section's topics read under titles of their own. How: This names one. */ }

			<p>Your location is shared only when you turn sharing on for an event, from 3 hours before the event starts until it ends. While it's on, your device sends your position, precise to about 0.1 meters, how accurate it is, and whether you've arrived, encrypted so only your group can read them. Each update replaces the one before, so no record of where you've been builds up, and your position is deleted an hour after your last update or when the event ends, whichever comes first.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h3>Notifications</h3>{ /* What: Subsection Heading Element. Why: A section's topics read under titles of their own. How: This names one. */ }

			<p>If you turn on notifications, your browser gives the app a push token, which we store so we can send you notifications through Firebase Cloud Messaging and your browser's own push service. A notification names the group and what happened, such as a new message, but never what was said.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h3>Linking a Google account</h3>{ /* What: Subsection Heading Element. Why: A section's topics read under titles of their own. How: This names one. */ }

			<p>Linking a Google account is optional, and lets you get your groups back on a new device. When you link one, Google shares your email address with Firebase Authentication, along with your name and profile picture if your Google account has them, and Firebase keeps them with your identity. Come Hang uses the link to recognize you on a new device, and your email address to fill in the checkout if you buy the upgrade. It never shows them to other members.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h3>Buying the upgrade</h3>{ /* What: Subsection Heading Element. Why: A section's topics read under titles of their own. How: This names one. */ }

			<p>The upgrade is sold through Polar, which handles the payment as the merchant of record. Polar collects your payment details under its own privacy policy, and we never see them. We send Polar your email address and your app ID, and Polar tells us when an order is paid or refunded, which is how the app knows you have the upgrade. We keep a record of each of those messages for a day, so none is handled twice.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h3>Writing to us</h3>{ /* What: Subsection Heading Element. Why: A section's topics read under titles of their own. How: This names one. */ }

			<p>If you write to us through Settings, your message and its subject, the version of Come Hang and the browser you're using, and your email address if you give one, go to Netlify, which passes them on to us. We use them only to answer you, and your email address only to reply.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h3>Keeping the service safe and running</h3>{ /* What: Subsection Heading Element. Why: A section's topics read under titles of their own. How: This names one. */ }

			<p>Our hosting and Firebase record technical details such as your IP address, your browser, and the time of each request, to run the service and protect it from abuse. Come Hang also uses Firebase App Check with Google reCAPTCHA Enterprise, which looks at signals from your browser and device to tell real use of the app from automated abuse. Google handles those signals under its own privacy policy.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h3>What stays on your device</h3>{ /* What: Subsection Heading Element. Why: A section's topics read under titles of their own. How: This names one. */ }

			<p>Your encryption keys, your chat history, messages you wrote offline until they're sent, the places of your groups' events, which requests and offers the app has already pointed out to you, whether you've answered its offer of notifications, and settings such as light or dark mode are stored on your device, in your browser's storage. Photos you open are kept only while the app is open, unless you save them to your device. Come Hang uses no tracking cookies, no analytics, and no ads.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>How we use information</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>We use the information above only to run Come Hang: to deliver messages and notifications, show each group its members and events, share the locations you choose to share, handle the upgrade, keep the service secure, and answer you when you write to us. We don't sell or rent your information, and we don't use it for advertising or profiling.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Who else handles it</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>A few services run parts of Come Hang for us, and each handles information only to provide its service:</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }



			<ul>{ /* What: Body List Element. Why: Related points read more easily as a list. How: This holds them. */ }


				<li><strong>Google Firebase</strong>, run by Google LLC, stores the app's information in the United States and provides its sign-in, notifications, and App Check, with reCAPTCHA Enterprise (<a href='https://policies.google.com/privacy' rel='noopener noreferrer' target='_blank'>Google's Privacy Policy</a>).</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li><strong>Netlify</strong> hosts the app's website and receives the messages you send us through Settings (<a href='https://www.netlify.com/privacy/' rel='noopener noreferrer' target='_blank'>Netlify's Privacy Policy</a>).</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li><strong>Polar</strong> handles payment for the upgrade (<a href='https://polar.sh/legal/privacy' rel='noopener noreferrer' target='_blank'>Polar's Privacy Policy</a>).</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }


			</ul>



			<p>The members of your groups see what you share with them. We may also disclose information when the law requires it, or to protect someone's safety or the security of the service, and then only what that requires. If Come Hang is ever passed to a new owner, this policy keeps applying to your information.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>How long we keep it</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }



			<ul>{ /* What: Body List Element. Why: Related points read more easily as a list. How: This holds them. */ }


				<li><strong>Chat messages</strong> are deleted from the server once every member's device has them, or after the period the group's owner sets, from 7 to 180 days, 30 by default.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li><strong>Events and their bring-lists</strong> are deleted 48 hours after the event ends. Your device keeps only each event's place, to suggest it when your group plans its next event, until you leave the group.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li><strong>Photos</strong> are deleted with their event, 48 hours after it ends, or sooner when the member who shared one or the group's owner deletes it. Before a photo is shared, your device shrinks it, which also removes the location and other details your camera stores in it.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li><strong>Your profile photo</strong>, if you add one, is kept in each group you're in until you remove it or your membership ends, when it's deleted from that group. Your device shrinks it first, which also removes the location and other details your camera stores in it.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li><strong>Your location</strong> is deleted an hour after your last update, or when the event ends.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li><strong>Requests to join</strong> are deleted once they're answered, or after 7 days.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li><strong>Notices</strong> are deleted after 30 days, and <strong>push tokens</strong> 60 days after your device last opened the app.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li><strong>A group</strong> is kept until its owner deletes it, which deletes its members, events, photos, and chat for everyone. When you leave a group or are removed, your membership is deleted.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li><strong>Your identity</strong>, meaning your ID, your public key, your list of groups, and whether you've bought the upgrade, is kept while you use the app, and deleted when you delete your data or ask us to. If you're in no group, haven't bought the upgrade or linked a Google account, and haven't opened the app for 180 days, it's deleted automatically.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li><strong>Messages you send us</strong> are kept only as long as we need them to answer you.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li><strong>What's on your device</strong> stays until you delete the app's data or uninstall it.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }


			</ul>



			<p>Messages already delivered to other members stay on their devices, and we can't delete them there.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Your choices and rights</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }



			<ul>{ /* What: Body List Element. Why: Related points read more easily as a list. How: This holds them. */ }


				<li>You can delete your data at any time, from the account part of Settings, or from the welcome screen if you're in no group. You leave every group you're in, each group you own passes to the member who joined it earliest, or is deleted if no one else is in it, and everything we keep for you is deleted, with your sign-in and any linked Google account, along with what Come Hang keeps on the device you use.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>You can leave a group at any time, and a group's owner can delete it.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>You can turn notifications and location sharing on and off whenever you like.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>Linking a Google account and buying the upgrade are both optional.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>You can also ask us for a copy of the information we hold about you, or ask us to correct or delete it, by writing to <a href='mailto:support@comehang.app'>support@comehang.app</a>, and we'll answer within 30 days. Since there's no account, we find your information through a linked Google account, so without one, deleting your data in the app is the way to remove it.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>Depending on where you live, such as California or the European Union, the law may give you more rights over your information. We honor the requests above for everyone, wherever they live, and you can also complain to your local data protection authority.</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }


			</ul>



			<p>Because what you share is encrypted, we can't read it, export it, or recover it for you. Your device holds your copy.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Security</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>Information travels to and from our servers over encrypted connections, what you share is encrypted on your device before it's sent, and the servers' access rules let each person reach only what they're allowed to. Come Hang isn't end-to-end encrypted in the strictest sense: it doesn't verify each member's devices, and the details listed above as readable are visible to the service. No system is perfectly secure, so we can't promise that information will never be reached without permission.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Age</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>Come Hang is for people 18 and older. We don't knowingly collect information from anyone younger. If you believe someone under 18 is using the app, write to us and we'll delete what we can.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Changes to this policy</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>When we change this policy, we'll post the new version here and update the date at the top. If a change significantly affects how your information is handled, we'll make a reasonable effort to tell you before it takes effect, such as in the app.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Contact</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>Gary S. Walton, Come Hang, Missouri, United States. Email <a href='mailto:support@comehang.app'>support@comehang.app</a>.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }


		</>


	);


}

// #endregion PriPolCom



// #region TerSerCom

/**
 * TerSerCom = Terms Service Component
 *
 * @summary
 * Renders the Terms of Service's body: the date they were last updated, then
 * their sections, in a fragment, so the static page and the Settings sheet can
 * each place it under a title of their own.
 *
 * @author z4nta0 <https://github.com/z4nta0>
 *
 * @param props - This component does not use any props.
 *
 * @returns The terms' body.
 *
 * @example
 * ```tsx
 * TerSerCom({}) // => <TerSerCom />
 * ```
 *
*/

function TerSerCom () : React.JSX.Element {


	return (


		<>{ /* What: Terms Service Fragment. Why: The terms' headings, paragraphs, and lists have to render as one child of whatever holds them. How: This groups them without adding an element. */ }


			<p>Last updated November 12, 2026</p>{ /* What: Updated Date Paragraph Element. Why: A reader should know which version they're reading. How: This gives the date of the last change. */ }

			<p>These terms are an agreement between you and Gary S. Walton, an individual based in Missouri, in the United States ("we" and "us" below), who makes and runs Come Hang. By starting or joining a group, or otherwise using the app, you agree to them, and to the <a href='/privacy'>Privacy Policy</a>, which explains how your information is handled. If you don't agree, please don't use Come Hang.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Who can use Come Hang</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>You must be at least 18 years old, and able to make a binding agreement, to use Come Hang.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>The service</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>Come Hang lets a group chat, plan events and who's bringing what, and share locations on the day of an event. It's free to use, with an optional one-time upgrade. It keeps changing as it's worked on, so features may change, and we may stop offering some or all of it. If we decide to shut Come Hang down, we'll try to give you reasonable notice.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Your identity and your device</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>Come Hang has no account to sign up for. Your identity, your encryption keys, and your chat history live on your device, in your browser's storage. If you delete the app's data, lose your device, or uninstall the app, you lose access to your groups, unless you've linked a Google account, which lets you get your groups back on a new device. Even then, the chat from before doesn't come back. Because what you share is encrypted, we can't recover it for you. Keeping your device and your Google account secure is up to you.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Your content</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>You keep ownership of what you post: messages, photos, events, bring-lists, names, and anything else you share (your content). You give us permission to store, encrypt, send, and delete your content as needed to run Come Hang, and for nothing else. That permission ends once your content is deleted from our servers.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<p>Your content is shared with the members of the group you post it in. They can read it, keep it, take screenshots of it, or pass it on, and a message delivered to their devices can't be taken back. Only share what you're comfortable sharing with them. You're responsible for your content, and you confirm you have the right to share it.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Groups</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>A group's owner controls its settings, can remove members and delete anyone's photos, and can delete the group, which deletes its chat, events, photos, and members for everyone. Any member can let in someone who asks to join, or decline or block them. If an owner deletes their data, each group they own passes to the member who joined it earliest. We don't moderate groups, and we can't read what's said in them, so we aren't responsible for what members post or for disagreements between them. You can leave a group at any time.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Location sharing</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>Sharing your location is always optional, and only works from 3 hours before an event until it ends. Positions come from your device and may be late, inaccurate, or missing, especially while the app isn't open. Only share your location with people you trust, and never share someone else's location without their permission. Come Hang isn't a safety or emergency service, so don't rely on it to find someone in an emergency. If anyone is in danger, call 911 or your local emergency number.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Acceptable use</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>When you use Come Hang, you agree not to:</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }



			<ul>{ /* What: Body List Element. Why: Related points read more easily as a list. How: This holds them. */ }


				<li>break the law, or help anyone else break it</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>harass, threaten, stalk, or bully anyone, or follow someone's location without their permission</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>share content that sexualizes minors, promotes violence, or infringes someone else's rights, such as their copyright or privacy, including photos of people who haven't agreed to be shared</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>pretend to be someone else, or mislead people about who you are</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>send spam or unwanted messages, or use the app to advertise</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>get around the app's limits or access rules, reach information that isn't yours, or disrupt or overload the service</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>use bots, scripts, or other automated tools on the service</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }

				<li>sell or resell the service, or offer it to others as your own</li>{ /* What: Body List Item Element. Why: Each point stands on its own. How: This holds one. */ }


			</ul>



			<p>We may remove content we learn breaks these terms, where we're able to, and suspend or end the access of anyone who breaks them.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>The upgrade</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>Owning more than one group needs the upgrade, a one-time purchase of $9.99 in US dollars, plus any tax that applies. With it you can own up to 10 groups instead of 1, belong to up to 20 instead of 10, and have up to 50 members in each group you own instead of 20. Buying it needs a linked Google account, so the upgrade follows you to a new device. It's a single payment, not a subscription.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<p>Polar processes the payment as the merchant of record, so your purchase is also covered by <a href='https://polar.sh/legal/terms' rel='noopener noreferrer' target='_blank'>Polar's terms</a>. The price may change in the future, which won't affect an upgrade you've already bought.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h3>Refunds</h3>{ /* What: Subsection Heading Element. Why: A section's topics read under titles of their own. How: This names one. */ }

			<p>If you're not happy with the upgrade, write to <a href='mailto:support@comehang.app'>support@comehang.app</a> within 14 days of buying it, and we'll refund it in full, for any reason. Once it's refunded, the upgrade is removed. The groups and members you already have stay, but you can't add more beyond the free limits until you're back within them. This doesn't limit any right to a refund the law gives you.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Our rights</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>The Come Hang name, logo, and design belong to Gary S. Walton. The app's code is licensed separately, under the PolyForm Noncommercial License 1.0.0, which sets out what you may do with the code itself, while these terms cover your use of the Come Hang service. If you send us ideas or feedback, we may use them without owing you anything.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Ending your use</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>You can stop using Come Hang at any time by deleting your data, from Settings or the welcome screen, which deletes what we keep for you and what Come Hang keeps on your device. We may suspend or end your access if you break these terms, or if we have to for legal or security reasons. The parts of these terms that by their nature should last, such as the disclaimers, the limits on liability, and the governing law, keep applying after your use ends.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Disclaimers</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>Come Hang is provided as is and as available. To the fullest extent the law allows, we make no promises about it beyond what these terms say, including any implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We don't promise that Come Hang will always be available or free of errors, that messages, notifications, or locations will always arrive or be accurate, or that information won't be lost.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Limits on liability</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>To the fullest extent the law allows, we aren't liable for any indirect, incidental, special, consequential, or punitive damages, or for lost information, profits, or goodwill, arising from your use of Come Hang or your inability to use it, even if we were told they were possible. Our total liability for any claim about Come Hang is limited to the greater of what you paid us in the 12 months before the claim, or $50. Some places don't allow these limits, so they may not all apply to you.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Indemnity</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>If someone brings a claim against us because of content you posted or because you broke these terms, you agree to cover the reasonable costs that result, including legal fees, to the extent the law allows.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Governing law and disputes</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>These terms are governed by the laws of the State of Missouri and of the United States, without regard to rules on conflicts of law. Before bringing a claim, please write to <a href='mailto:support@comehang.app'>support@comehang.app</a> so we can try to resolve it together. Any dispute we can't resolve that way will be decided in the state or federal courts located in Missouri, and you and we both agree to those courts' jurisdiction, though either of us may bring a claim in small claims court where it qualifies. Nothing in these terms takes away rights the law gives you as a consumer that can't be waived.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Changes to these terms</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>We may update these terms from time to time. We'll post the new version here and update the date at the top, and if a change is significant, we'll make a reasonable effort to tell you before it takes effect, such as in the app. If you keep using Come Hang after a change takes effect, you accept the new terms.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Other terms</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>These terms and the Privacy Policy are the whole agreement between you and us about Come Hang. If any part is found unenforceable, the rest still applies. If we don't enforce a part right away, we haven't given up the right to later. You can't transfer your rights under these terms, but we may transfer ours, such as to a new owner of Come Hang.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }

			<h2>Contact</h2>{ /* What: Section Heading Element. Why: The document reads in titled sections. How: This names one. */ }

			<p>Gary S. Walton, Come Hang, Missouri, United States. Email <a href='mailto:support@comehang.app'>support@comehang.app</a>.</p>{ /* What: Body Paragraph Element. Why: The document is plain prose. How: This holds one paragraph. */ }


		</>


	);


}

// #endregion TerSerCom

// #endregion Components



// #region Exports

export { PriPolCom, TerSerCom }; // What: Named Exports. Why: The build renders both documents into their pages, and Settings shows them in a sheet. How: This exports the two components.

// #endregion Exports


