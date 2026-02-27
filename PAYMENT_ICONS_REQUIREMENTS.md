# 🎨 Payment Icons Requirements for UI Team

**Project:** Food Delivery Application  
**Date:** February 27, 2026  
**Requested By:** Development Team  
**For:** UI/Design Team

---

## 📋 Overview

We need payment method icons to replace emojis in the payment modal and checkout page. These icons will make the payment interface look more professional.

---

## 📁 Folder Structure

**Location:** `food-delivery-ui/public/icons/payment-methods/`

Please place all payment icons in this folder with the exact names specified below.

---

## 🎯 Required Icons

### 1. Card Payment Icons

#### Generic Card Icon
- **Filename:** `card-generic.svg` or `card-generic.png`
- **Size:** 48x48px (or larger, we'll scale)
- **Format:** SVG preferred (PNG acceptable)
- **Description:** Generic credit/debit card icon
- **Usage:** Default card icon before card type is detected

#### Visa Card
- **Filename:** `visa.svg` or `visa.png`
- **Size:** 48x48px
- **Description:** Visa logo/icon
- **Usage:** Shows when user enters Visa card (starts with 4)

#### Mastercard
- **Filename:** `mastercard.svg` or `mastercard.png`
- **Size:** 48x48px
- **Description:** Mastercard logo/icon
- **Usage:** Shows when user enters Mastercard (starts with 51-55)

#### American Express (Amex)
- **Filename:** `amex.svg` or `amex.png`
- **Size:** 48x48px
- **Description:** American Express logo/icon
- **Usage:** Shows when user enters Amex card (starts with 34 or 37)

#### RuPay
- **Filename:** `rupay.svg` or `rupay.png`
- **Size:** 48x48px
- **Description:** RuPay logo/icon
- **Usage:** Shows when user enters RuPay card

---

### 2. UPI Payment Icons

#### Generic UPI Icon
- **Filename:** `upi.svg` or `upi.png`
- **Size:** 48x48px
- **Description:** UPI logo or generic UPI payment icon
- **Usage:** Main UPI payment option

#### Google Pay (GPay)
- **Filename:** `gpay.svg` or `gpay.png`
- **Size:** 48x48px
- **Description:** Google Pay logo
- **Usage:** UPI payment modal

#### PhonePe
- **Filename:** `phonepe.svg` or `phonepe.png`
- **Size:** 48x48px
- **Description:** PhonePe logo
- **Usage:** UPI payment modal

#### Paytm
- **Filename:** `paytm.svg` or `paytm.png`
- **Size:** 48x48px
- **Description:** Paytm logo
- **Usage:** UPI payment modal

---

### 3. Wallet Payment Icons

#### Paytm Wallet
- **Filename:** `paytm-wallet.svg` or `paytm-wallet.png`
- **Size:** 48x48px
- **Description:** Paytm wallet icon (different from UPI if possible)
- **Usage:** Wallet selection in payment modal

#### PhonePe Wallet
- **Filename:** `phonepe-wallet.svg` or `phonepe-wallet.png`
- **Size:** 48x48px
- **Description:** PhonePe wallet icon
- **Usage:** Wallet selection in payment modal

#### Amazon Pay
- **Filename:** `amazonpay.svg` or `amazonpay.png`
- **Size:** 48x48px
- **Description:** Amazon Pay logo
- **Usage:** Wallet selection in payment modal

---

### 4. Cash on Delivery Icon

#### COD Icon
- **Filename:** `cod.svg` or `cod.png`
- **Size:** 48x48px
- **Description:** Cash/money icon or "Cash on Delivery" icon
- **Usage:** COD payment option

---

## 🎨 Design Guidelines

### Style Requirements:
- **Style:** Modern, clean, professional
- **Colors:** Use official brand colors for each payment method
- **Background:** Transparent (for SVG/PNG)
- **Format:** SVG preferred (scalable), PNG acceptable
- **Size:** 48x48px minimum (we can scale down if larger)

### Quality Requirements:
- **Resolution:** High quality, crisp edges
- **File Size:** Keep under 50KB per icon
- **Consistency:** All icons should have similar visual weight
- **Accessibility:** Clear and recognizable at small sizes

### Color Scheme:
- **Visa:** Blue (#1A1F71)
- **Mastercard:** Red/Orange (#EB001B, #FF5F00)
- **Amex:** Blue (#006FCF)
- **RuPay:** Green/Orange (#097939, #FC7B13)
- **GPay:** Blue/Green/Yellow/Red (Google colors)
- **PhonePe:** Purple (#5F259F)
- **Paytm:** Blue (#00BAF2)
- **Amazon Pay:** Orange (#FF9900)

---

## 📦 Delivery Format

### Option 1: Individual Files (Preferred)
```
payment-methods/
├── card-generic.svg
├── visa.svg
├── mastercard.svg
├── amex.svg
├── rupay.svg
├── upi.svg
├── gpay.svg
├── phonepe.svg
├── paytm.svg
├── paytm-wallet.svg
├── phonepe-wallet.svg
├── amazonpay.svg
└── cod.svg
```

### Option 2: ZIP File
- Compress all icons into a single ZIP file
- Name: `payment-icons.zip`
- Include a README with icon descriptions

---

## 🖼️ Usage Examples

### Where These Icons Will Be Used:

#### 1. Payment Method Selection (Checkout Page)
```
┌─────────────────────────────────────┐
│ [💳] Credit/Debit Card              │  ← card-generic.svg
│     Visa, Mastercard, Rupay         │
├─────────────────────────────────────┤
│ [📱] UPI Payment                    │  ← upi.svg
│     PhonePe, Google Pay, Paytm      │
├─────────────────────────────────────┤
│ [👛] Digital Wallet                 │  ← wallet icon
│     Paytm, Amazon Pay               │
├─────────────────────────────────────┤
│ [💵] Cash on Delivery               │  ← cod.svg
│     Pay when order arrives          │
└─────────────────────────────────────┘
```

#### 2. Card Type Detection (Payment Modal)
```
Card Number: 4532 1234 5678 9010  [Visa Icon]
                                    ↑ visa.svg
```

#### 3. Wallet Selection (Payment Modal)
```
┌─────────────────────────────────────┐
│ [Paytm Icon] Paytm                  │  ← paytm-wallet.svg
│              Balance: ₹5,000        │
├─────────────────────────────────────┤
│ [PhonePe Icon] PhonePe              │  ← phonepe-wallet.svg
│                Balance: ₹3,500      │
├─────────────────────────────────────┤
│ [Amazon Icon] Amazon Pay            │  ← amazonpay.svg
│               Balance: ₹4,200       │
└─────────────────────────────────────┘
```

---

## ⏰ Timeline

**Requested Delivery:** As soon as possible  
**Priority:** Medium-High  
**Blocking:** No (we're using emojis as fallback)

---

## 📞 Contact

**For Questions:**
- Development Team Lead
- Project Manager

**Delivery Method:**
- Place files in: `food-delivery-ui/public/icons/payment-methods/`
- Or send via email/Slack with ZIP file

---

## ✅ Checklist for UI Team

Before delivery, please verify:

- [ ] All 13 icons created
- [ ] Correct filenames used
- [ ] SVG or PNG format
- [ ] Transparent background
- [ ] Minimum 48x48px size
- [ ] Official brand colors used
- [ ] High quality, crisp edges
- [ ] Files under 50KB each
- [ ] All icons have similar visual weight
- [ ] Icons look good at small sizes

---

## 📝 Notes

### Optional (Nice to Have):
- Multiple sizes (24x24, 48x48, 96x96)
- Dark mode variants
- Animated versions for loading states

### Reference Resources:
- Official brand guidelines for each payment method
- Existing payment icons from competitors
- Material Design icons for inspiration

---

## 🎯 Summary

**Total Icons Needed:** 13  
**Format:** SVG (preferred) or PNG  
**Size:** 48x48px minimum  
**Location:** `public/icons/payment-methods/`  
**Priority:** Medium-High  

Once delivered, the development team will integrate these icons into the payment interface, replacing the current emoji placeholders.

---

**Thank you for your support!** 🙏

If you have any questions or need clarification, please reach out to the development team.
