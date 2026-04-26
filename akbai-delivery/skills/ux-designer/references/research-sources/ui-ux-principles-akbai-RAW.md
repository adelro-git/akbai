# UI/UX Principles — NotebookLM RAW Q&A

**Notebook:** AKBai UI/UX Principles (`0127f12f-8da7-4932-833b-9a3b195cce94`)
**Sources:** 15 URLs (Laws of UX x7, NN/g x2, Don Norman, Hooked, WCAG, web.dev x2, Smashing 404)
**Run:** 2026-04-25

---

## Q1: Top 12 UX laws/principles for mobile-first PWA targeting first-time-tool MSME owners

Continuing conversation 9c187ee7...
Answer:
**1. Hick's Law**
(a) The time required to make a decision increases with the number and 
complexity of choices presented. 
(b) "Break complex tasks into smaller steps in order to decrease cognitive 
load." [1]
(c) **UI Rule:** Present only one primary action per screen (like "Log Sale") 
rather than overwhelming first-time users with a dense dashboard of accounting 
options.

**2. Fitts's Law**
(a) The time it takes to acquire a target is a function of the distance to and 
size of that target.
(b) "Touch targets should be large enough for users to accurately select them."
[2]
(c) **UI Rule:** Make primary action buttons (e.g., "Add Expense") oversized 
and place them at the bottom of the screen within easy thumb reach.

**3. Jakob's Law**
(a) Users prefer your app to work the same way as all the other apps they 
already know and use.
(b) "Users will transfer expectations they have built around one familiar 
product to another that appears similar." [3]
(c) **UI Rule:** Utilize universally recognized mobile icons (like a magnifying
glass for search or a house for home) rather than inventing custom symbols.

**4. Tesler's Law (Conservation of Complexity)**
(a) Every system has an inherent amount of complexity that cannot be removed, 
only shifted to the user or the system.
(b) "Ensure as much as possible of the burden is lifted from users by dealing 
with inherent complexity during design and development." [4]
(c) **UI Rule:** Have the AKBai AI automatically scan and categorize 
photographed receipts so the MSME owner doesn't have to manually tag them.

**5. Goal-Gradient Effect**
(a) People work progressively faster to reach a goal the closer they perceive 
they are to completing it.
(b) "Provide a clear indication of progress in order to motivate users to 
complete tasks." [5]
(c) **UI Rule:** Display a visually filling progress bar during the initial 
account setup to encourage business owners to complete their profile.

**6. Peak-End Rule**
(a) People judge an experience largely based on how they felt at its most 
intense peak and at its conclusion.
(b) "Identify the moments when your product is most helpful, valuable, or 
entertaining and design to delight the end user." [6]
(c) **UI Rule:** Trigger a celebratory animation when a user successfully 
finishes logging their first full week of sales.

**7. Aesthetic-Usability Effect**
(a) Users naturally perceive visually pleasing designs as being more usable and
functional.
(b) "People are more tolerant of minor usability issues when the design of a 
product or service is aesthetically pleasing." [7]
(c) **UI Rule:** Use a clean, modern interface with ample white space to make 
accounting feel friendly and approachable rather than intimidating.

**8. The Hooked Model (Simplify Actions)**
(a) Habit-forming products drive repeated engagement by making the required 
user actions as simple as possible.
(b) "Discover how to make user actions as simple as possible, increasing the 
likelihood of engagement and interaction with your product." [8]
(c) **UI Rule:** Send a daily push notification reminding users to log sales 
that opens directly to a one-tap entry screen.

**9. Design for Interruptions**
(a) Because mobile phones are used everywhere, user attention is often 
fragmented and sessions are very short.
(b) "The mobile app or website must save state at all times and be prepared for
such interruptions." [9]
(c) **UI Rule:** Automatically auto-save in-progress invoice entries so no data
is lost if the owner minimizes the app to assist a customer.

**10. Single Window / Self-Sufficiency**
(a) Mobile design should be self-sufficient because users cannot easily split 
their screens to look up external information.
(b) "Users should not have to leave an app (or website) to find information 
that the app requires, but that it doesn't provide." [10]
(c) **UI Rule:** Embed a built-in calculator on the transaction screen so users
don't have to switch apps to compute totals.

**11. Error Prevention (Legal, Financial, Data)**
(a) Systems handling financial transactions must check for errors and allow 
users to review data before final submission.
(b) "A mechanism is available for reviewing, confirming, and correcting 
information before finalizing the submission." [11]
(c) **UI Rule:** Always present a confirmation modal summarizing the financial 
transaction details before a user officially records an entry.

**12. Largest Contentful Paint (LCP) Optimization**
(a) Fast rendering of the main page content builds trust and reassures users 
that the application is useful.
(b) "To provide a good user experience, sites should strive to have Largest 
Contentful Paint of 2.5 seconds or less." [12]
(c) **UI Rule:** Ensure the core metric (like "Today's Total Sales") loads 
instantly, deferring the loading of heavier secondary charts or reports.

Resumed conversation: 9c187ee7-4b8b-4104-99fe-96cae9c79e1d




## Q2: Top 5 evidence-backed retention drivers for mobile productivity apps

Answer:
**1. Triggers to Drive Daily Use (The Hooked Model)**
The Hooked Model emphasizes the importance of embedding a product into a user's
routine to prevent them from abandoning it. To build a habit-forming product, 
designers must "identify and utilize external and internal triggers to prompt 
user action, ensuring your product becomes a regular part of users' routines" 
[1]. 
* **AKBai Application:** Send a daily SMS or push notification (external 
trigger) right at the typical store closing time, asking, "Ready to tally 
today's sales?"

**2. Variable Rewards (The Hooked Model)**
Predictable loops become boring, but unpredictability drives sustained 
engagement. To deepen the user's connection with the product, apps should 
"explore how to use variable rewards to keep users engaged and excited" [1]. 
* **AKBai Application:** Occasionally reward the user after logging a 
transaction with a surprise, AI-generated business insight—such as "Fun fact: 
Tuesday is your most profitable day!"—to keep them curious.

**3. User Investment (The Hooked Model)**
Retention increases when users put their own data or effort into the system, 
making it harder to leave. Habit-forming products use "strategies to encourage 
users to invest time, effort, and resources into your product, creating a cycle
of repeated engagement" [2]. 
* **AKBai Application:** Encourage the MSME owner to customize their inventory 
list and frequent customer profiles, meaning the more they use the app, the 
smarter and more indispensable the AI becomes for their specific shop.

**4. Goal-Gradient Effect (Artificial Progress)**
Users accelerate their behavior and stay retained when they feel they are 
nearing a finish line. The Goal-Gradient effect shows that "the closer users 
are to completing a task, the faster they work towards reaching it," and that 
"providing artificial progress towards a goal will help to ensure users are 
more likely to have the motivation to complete that task" [3, 4].
* **AKBai Application:** Display a visually filling "Monthly Sales Goal" 
progress bar on the dashboard that accelerates data-entry motivation as the 
business owner gets closer to the end of the month.

**5. Peak-End Framing**
Retention is heavily influenced by a user's memory of using the app, which is 
judged not by the total experience, but "largely based on how they felt at its 
peak and at its end" [5]. To drive retention through positive memories, 
designers should "identify the moments when your product is most helpful, 
valuable, or entertaining and design to delight the end user" [6]. 
* **AKBai Application:** Conclude the potentially stressful end-of-month 
accounting or tax-prep flow with a highly satisfying, celebratory animation and
a clear message stating, "Your books are perfectly balanced!"

Conversation: 9c187ee7-4b8b-4104-99fe-96cae9c79e1d (turn 1)



## Q3: 8-10 most-cited accessibility & performance rules for mid-range Android over slow networks

Answer:
**1. Optimize Largest Contentful Paint (LCP) for Slow Networks**
To provide a fast perceived load speed on slow 3G/4G connections, the PWA 
should strive for an LCP of 2.5 seconds or less, ensuring the main content 
renders quickly [1, 2]. Because mobile devices experience variable 
connectivity, you should also minimize back-and-forth client-server trips by 
keeping pages light and reducing the number of page loads required [3].

**2. WCAG 2.1 AA Contrast Minimums**
The visual presentation of regular text and images of text must have a contrast
ratio of at least 4.5:1, while large-scale text requires at least a 3:1 ratio 
[4, 5]. Additionally, non-text elements—like user interface components (e.g., 
input fields, icons) and graphical objects necessary for understanding the 
app—must maintain a minimum 3:1 contrast ratio against adjacent colors [6, 7].

**3. Implement `prefers-reduced-motion` Behavior**
To accommodate users who experience motion-triggered vestibular disorders 
(motion sickness) or those using lower-end hardware, the PWA must use the 
`prefers-reduced-motion` CSS media query [8, 9]. If the user has requested 
minimized animation at the OS level, you should disable non-essential, 
decorative animations and transitions, potentially relying on static 
alternative assets [10, 11].

**4. Touch Target Minimums (Fitts's Law & WCAG)**
To decrease target acquisition time and prevent accidental taps on small phone 
screens (Fitts's Law), touch targets must be large and well-spaced [12, 13]. To
meet WCAG 2.2 AA minimums, pointer inputs must be at least 24 by 24 CSS pixels 
[14]. However, for optimal usability (WCAG 2.1 AAA Target Size Enhanced), 
primary interactive controls should be at least 44 by 44 CSS pixels [15, 16].

**5. Reflow and Unrestricted Orientation**
Content must be able to reflow dynamically so that users are not forced to 
scroll horizontally (in two dimensions) down to a width of 320 CSS pixels [17, 
18]. Furthermore, the app must not lock its view or operation to a single 
display orientation (like portrait only), unless absolutely essential [19, 20].

**6. Design for Interruptions and State Saving**
Because mobile sessions average just 72 seconds and users are frequently 
distracted by their environment, the PWA must be designed for interruptions 
[21]. The app must continuously save the user's state so that if they minimize 
the app or lose connection, they can resume their task seamlessly without 
losing previously entered data [22]. 

**7. Self-Sufficient Tasks (Single-Window Constraint)**
Mobile users generally cannot split their screens to look up external 
information while working [23]. Therefore, tasks within the PWA must be 
self-sufficient; the user should not have to leave the app or rely on their 
short-term memory to copy-paste information required by the application [23].

**8. Simple Pointer Gestures and Cancellation**
All functionality should be operable with a simple, single-pointer tap rather 
than relying on complex path-based or multipoint gestures [24]. To prevent 
accidental inputs, actions should not execute on the initial "down-event" 
(touching the screen); instead, completion should occur on the "up-event" so 
users can cancel the action by dragging their finger away before releasing [25,
26]. 

**9. Error Prevention for Financial and Data Inputs**
Because an MSME accounting app processes financial and user-controllable data, 
the PWA must actively prevent input errors [27]. Submissions must either be 
fully reversible, checked by the system automatically with an opportunity for 
the user to correct them, or require a final confirmation step before the 
transaction is finalized [27, 28].

Conversation: 9c187ee7-4b8b-4104-99fe-96cae9c79e1d (turn 1)



## Q4: Don Norman emotional design — visceral/behavioral/reflective for utilitarian app warmth

Answer:
The **visceral layer** refers to a user's subconscious, immediate emotional 
reaction to the visual appearance of an interface. According to Don Norman, the
affective system makes rapid judgments, instantly assigning a positive or 
negative value to an environment before conscious thought occurs [1, 2]. When a
utilitarian tool incorporates warmth and ornament, it induces a positive affect
that bathes the brain in neurochemicals, broadening thought processes and 
making people "more flexible and creative" [3, 4]. For AKBai, replacing a 
sterile, generic dashboard with a warm, honey-palette illustration design 
targets this visceral level; it immediately transforms the potentially 
intimidating, anxiety-inducing task of accounting into a welcoming, 
approachable first impression for a Filipino MSME owner.

The **behavioral layer** is concerned with the actual experience of using the 
product, where aesthetic appeal directly enhances how well the user performs 
tasks. Norman emphasizes the heretical but proven idea that "pleasing things 
work better, are easier to learn, and produce a more harmonious result" [4, 5].
A positive emotional state increases a user's "tolerance for minor difficulties
and blockages," meaning they are more likely to creatively solve problems 
rather than give up when confused [6]. If a first-time user of AKBai struggles 
slightly with a new data-entry flow, the aesthetically pleasing, warm UI will 
mask these minor usability frictions and keep the user engaged rather than 
frustrated [7, 8]. 

The **reflective layer** involves conscious thought, personal meaning, and how 
the user ultimately remembers and feels about using the product long-term. 
Norman argues that true beauty requires a harmony of function and aesthetics, 
ensuring products are not just useful but deeply satisfying and "a pleasure to 
own, a pleasure to use" [9, 10]. While a generic accounting app might simply 
process numbers, AKBai’s warm, localized illustrations allow the MSME owner to 
form a conscious, positive attachment to the tool. This reflective satisfaction
means the user doesn't just tolerate the app out of necessity, but actually 
enjoys it because the design brings a sense of pride and pleasure to their 
daily business management [5, 10].

*(Note: The specific terms "visceral," "behavioral," and "reflective" layers of
emotional design are from Don Norman's broader framework and are not explicitly
named in the provided sources. I have used outside knowledge to define these 
three layers, while directly applying the source material's concepts of affect,
cognition, and the aesthetic-usability effect to support them.)*

Conversation: 9c187ee7-4b8b-4104-99fe-96cae9c79e1d (turn 1)



## Q5: UX guidance on form design and onboarding for low-digital-literacy users

Answer:
**Single-Question vs. Multi-Question Screens**
For low-digital-literacy users on mobile, single-question screens are vastly 
superior. Hick's Law states that decision time increases with complexity, so 
designers should use progressive onboarding and break complex tasks into 
smaller steps to minimize cognitive load [1]. Furthermore, because mobile 
attention is often fragmented and sessions are short, flooding users with walls
of text or long forms is "not interruption friendly" [2, 3]. A simple, focused 
task on a single screen is much easier to complete and resume if interrupted 
[3].

**Touch Target Minimum Size**
Because typing and navigating on a touchscreen can be difficult and prone to 
accidental taps, mobile targets must be considerably larger than those on a 
desktop [4, 5]. Following Fitts's Law, touch targets must be large and 
well-spaced for users to accurately select them [6]. Specifically, WCAG 2.1 AAA
guidelines dictate that the size of the target for pointer inputs should be at 
least 44 by 44 CSS pixels [7], with an absolute minimum of 24 by 24 CSS pixels 
to meet AA standards [8]. 

**Error Recovery Copy**
When users make mistakes—which is highly likely on crowded mobile touchscreens 
[4, 5]—the system must automatically detect the error, clearly identify the 
item in error, and describe it to the user in text [9]. Crucially, if 
suggestions for correcting the error are known, the system must provide those 
specific suggestions to the user [10]. Because accidental touches can leave 
users disoriented, providing clear correction instructions and an "Undo" 
mechanism is essential for mobile usability [5].

***

**3 Rules for AKBai's 5-Step Setup Wizard:**

1. **One Concept Per Screen (Hick's Law):** Rather than asking for the shop 
name, owner name, and contact details on one long scrolling page, use 
progressive onboarding [1]. Dedicate one step purely to the shop name, the next
to the phone number, etc., to eliminate cognitive overload.
2. **Oversized, 44px Minimum Buttons (Fitts's Law & WCAG):** When asking users 
to select their business category (e.g., "Sari-Sari Store" vs. "Carinderia"), 
make the selection buttons massive—at least 44 by 44 CSS pixels [7]—so users 
with low digital literacy don't accidentally tap the wrong option [5, 6].
3. **Prescriptive Error Text:** If a user skips a required field or enters a 
badly formatted phone number, do not just highlight the box in red. Explicitly 
describe the error in text and provide the suggested correction (e.g., "Please 
enter a valid 11-digit mobile number starting with 09") [9, 10].

Conversation: 9c187ee7-4b8b-4104-99fe-96cae9c79e1d (turn 1)


## Q6: Top 3 UX investments that move first-week retention for a mobile productivity app

Answer:
**1. Engineering External Triggers (The Hooked Model)**
*   **Evidence:** "Identify and utilize external and internal triggers to 
prompt user action, ensuring your product becomes a regular part of users' 
routines." [1]
*   **AKBai Application:** You cannot passively wait for a busy Filipino MSME 
owner to remember to do their bookkeeping during their chaotic first week. You 
must force the daily habit loop to take root by pushing a contextual 
notification right at their typical store closing time that deep-links directly
into a frictionless, single-tap "Record Today's Sales" screen. 

**2. Artificial Progress for Onboarding (Goal-Gradient Effect)**
*   **Evidence:** "Providing artificial progress towards a goal will help to 
ensure users are more likely to have the motivation to complete that task." [2]
*   **AKBai Application:** The heaviest cognitive lift is the initial app 
setup, which is where most users churn. Visually hand them a "Business Profile"
progress bar that is already 40% filled just for downloading the app and 
verifying their phone number; perceiving they are already halfway to the finish
line will drive them to aggressively complete the remaining setup tasks.

**3. Optimizing the Emotional Climax (Peak-End Rule)**
*   **Evidence:** "People judge an experience largely based on how they felt at
its peak and at its end, rather than the total sum or average of every moment 
of the experience." [3]
*   **AKBai Application:** Accounting inherently induces anxiety, so you must 
artificially manufacture a delightful memory at the exact end of the workflow 
so users actually want to return on day two. Ditch the sterile "Transaction 
Saved" toast message and instead use AKBai's warm, honey-palette illustration 
style to trigger a highly satisfying, celebratory animation the moment they 
finish logging their daily books.

Conversation: 9c187ee7-4b8b-4104-99fe-96cae9c79e1d (turn 1)

