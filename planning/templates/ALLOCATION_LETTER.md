# Plot / Unit Allocation Letter (Draft Template)

> **Status:** Standard FCT developer allocation format — **requires Abraham legal review** before production use  
> **Trigger:** Issued on reservation confirmation + initial payment verified

---

```
TRIPLE A REALTY PROJECTS LTD
Suite D15B, Platinum Mega Plaza, Jahi, Abuja
RC No. 8168740

Date: {DATE}

{CLIENT_NAME}
{CLIENT_ADDRESS}

Dear {CLIENT_SALUTATION},

RE: ALLOCATION OF {PLOT_TYPE} — {ESTATE_NAME}, {AREA}, ABUJA

We refer to your reservation and payment towards the acquisition of property 
at the above-named estate developed by Triple A Realty Projects Ltd.

Pursuant to your application and subject to the terms of the Sale Agreement 
(reference {CONTRACT_REF}), we hereby ALLOCATE to you:

    Estate Name    : {ESTATE_NAME}
    Plot/Unit No.  : {PLOT_NUMBER}
    Property Type  : {TYPE}  (e.g. 4-Bedroom Semi-Detached Duplex)
    Land Area      : {SQM} sqm (approx.)
    Block/Phase    : {PHASE}

CONDITIONS OF ALLOCATION

1. This allocation is subject to the full terms of the Sale Agreement and 
   payment schedule attached hereto.
2. Title documentation (Survey Plan, Allocation Letter, Deed of Assignment 
   as applicable) shall be processed upon completion of agreed payments.
3. Construction shall proceed in accordance with Triple A's Agile milestone 
   framework: Foundation → Shell → Finishing, with progress reports 
   provided via the client portal.
4. This allocation does not constitute a Certificate of Occupancy. C of O 
   processing is subject to FCTA/FCDA requirements and separate arrangements.
5. Transfer of allocation to a third party requires written consent of 
   Triple A Realty Projects Ltd and payment of applicable fees.

Please contact your assigned Project Manager, {PM_NAME}, at {PM_PHONE} 
for construction updates and payment enquiries.

Yours faithfully,


_________________________
Abraham Ahmed
Founder & CEO
TRIPLE A REALTY PROJECTS LTD
```

---

## Attachments Checklist

- [ ] Sale Agreement / Offer Letter
- [ ] Payment Schedule
- [ ] Estate layout showing allocated plot (map excerpt)
- [ ] Client portal access instructions

---

## App Trigger

```
ON payment_verified WHERE type = 'reservation_fee' AND plot.status = 'reserved'
  → generate allocation_letter PDF
  → plot.status = 'allocated'
  → notify client portal
```
