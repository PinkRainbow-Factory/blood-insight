# Blood Insight Agent Release Readiness Checklist

## UI polish
- Login, dashboard, profile, schedule, labs, disease, report, history, settings screens visually checked
- Mobile portrait layout checked
- Mobile landscape layout checked
- Metric cards align consistently with long Korean names and English codes
- Report export cover, PDF, image, share flows checked

## Functional checks
- Login / signup / logout works
- Login ID recovery works
- Password reset works
- Auto login works
- AI report generation works with current NAS deployment
- AI report retry flow works when network or provider response fails
- OCR sample flow works
- Custom lab input works
- Report history save and reload works
- Compare history works
- Notification scheduling works
- Draft autosave / restore works for profile, lab values, and custom labs

## Data and safety
- Gemini / ChatGPT key save states confirmed
- Medical safety copy reviewed
- Disease explanation reviewed
- Emergency / retest cards reviewed

## Distribution prep
- Final icon and splash confirmed
- Release signing planned
- NAS latest package deployed
- APK install tested on target phone
- App runtime status card shows version/build and latest draft save time
