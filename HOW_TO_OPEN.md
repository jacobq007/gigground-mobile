# How to open the GigGround app

You don't need to understand any code. There are two ways — the **browser way is easiest**.

---

## ✅ EASIEST: see it in your computer's browser

1. In the `gigground-mobile` folder, **double-click `OPEN_IN_BROWSER.bat`**.
2. A black window opens, then a **browser tab** opens by itself showing the app inside a phone-shaped frame.
3. If the tab doesn't open on its own, open Chrome and go to: **http://localhost:8081**

That's it — no phone, no installs. Keep the black window open while using it; close it when done.

> Note: the phone version below needs a matching "Expo Go" version, which the app store may not have yet. The browser way avoids that completely.

---

## Phone way (only if the browser way isn't enough)

You don't need to understand any code. Just follow these steps.

## First time setup (do once)

1. On your **phone**, open the app store:
   - **Android** → Google Play Store
   - **iPhone** → App Store
2. Search for **"Expo Go"** and install it (it's free, made by Expo).
3. Make sure your **phone and this computer are on the same Wi-Fi**.

## Every time you want to see the app

1. On the **computer**, go to the folder `gigground-mobile` and **double-click `START_APP.bat`**.
   - A black window opens and shows a **QR code**. Leave this window open.
2. On your **phone**:
   - **Android** → open **Expo Go**, tap **"Scan QR code"**, point it at the screen.
   - **iPhone** → open the **Camera** app, point it at the QR code, tap the banner that appears.
3. The GigGround app loads on your phone. First load takes ~30 seconds; after that it's quick.

### If the QR code doesn't work
Open **Expo Go** → tap **"Enter URL manually"** → type:

```
exp://192.168.0.102:8081
```

(That address only works on your home Wi-Fi. If your computer's Wi-Fi changes, the number may change — the QR code always has the right one.)

## Demo login
The app is pre-filled to sign in as a demo worker:
- Email: `rahul@test.com`
- Password: `test123`

Just tap **Sign in**. You can also create a fresh account to see the sign-up flow.

## Good to know
- All data is **stored on the phone** for now (no internet server yet). That's on purpose — the app is fully usable for trying out and showing people.
- To start over with fresh demo data, you can sign out and sign back in.
- When you're done, just close the black window on the computer.
