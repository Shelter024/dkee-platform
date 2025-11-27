# Feature Updates (Dark Mode, Ghana Cedi, Profile Editing, Vehicle Cover)

## Dark Mode
- Implemented `ThemeProvider` with localStorage persistence and system preference initialization.
- Toggle added to `Navbar` (desktop + mobile) using Sun/Moon icons.
- Design tokens via CSS variables adapt automatically in dark mode.

## Ghana Cedi Currency
- Added `formatCurrencyGHS` helper in `lib/utils.ts` ensuring `GH₵` symbol.
- Updated `FeatureGate` pricing copy to `Starting from GH₵15/month`.
- Use `formatCurrencyGHS(amount)` (or `formatCurrency`) for all monetary UI displays.

## Profile Editing (Customer)
- New API route: `api/users/me/update` (PATCH) allows updating name, email, phone, image, password.
- Password requires minimum 8 characters; hashed with bcrypt before persistence.
- New dashboard page: `dashboard/customer/account` with form fields and loading state.
- Staff/admin page pending (can mirror customer implementation under `dashboard/admin/account`).

## Vehicle Cover Image
- Added generator `lib/vehicle-image.ts` producing SVG cover based on first vehicle's make/model/year/color.
- `dashboard/customer/page.tsx` now fetches `/api/customers/me` and displays dynamic cover (falls back to gradient while loading).
- Vehicle color normalized; fallback brand navy if undefined.

## Developer Notes
- Extend staff account settings by copying customer page to `dashboard/admin/account` and adjusting access control.
- For wider currency replacement, grep for `$` and update any remaining instances.
- Consider adding server-side theme cookie for initial paint if FOUC is observed.
- The SVG cover is deterministic; replace with Cloudinary or AI generated image by uploading data URL if richer visuals are needed.

## Next Enhancements (Suggested)
1. Add avatar upload (integrate Cloudinary) to account settings.
2. Provide success/failure inline form validation messages (email uniqueness, phone format).
3. Add plan selection with Ghana Cedi pricing table on `/subscriptions`.
4. Implement staff profile settings page.
5. Introduce `useCurrency()` hook if multi-currency support required later.
6. Add A11y focus outlines for dark mode high contrast variant.
