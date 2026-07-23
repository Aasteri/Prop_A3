#!/usr/bin/env python3
"""Generate LISTINGS_SEED.json from curated FOR SALE document extraction."""
import json

LISTINGS = [
    {"location": "Apo Jahi", "property_type": "3 Bedroom Flat", "finish": "FF", "payment_plan": "TBD"},
    {"location": "Apo Jahi", "property_type": "4 Bedroom Terrace", "finish": "FF", "payment_plan": "TBD"},
    {"location": "Apo Jahi", "property_type": "5 Bedroom Semi Detached Duplex", "finish": "SF", "payment_plan": "TBD"},
    {"location": "Apo Jahi", "property_type": "3 Bedroom Flat with BQ", "finish": "SF", "payment_plan": "TBD"},
    {"location": "Wuse Zone 3", "property_type": "2 Bedroom Flat", "finish": "FF", "payment_plan": "TBD"},
    {"location": "Katampe Extension", "property_type": "6 Bedroom Detached", "finish": "SF", "payment_plan": "TBD"},
    {"location": "Katampe Extension", "property_type": "5 Bedroom Semi Detached Duplex", "finish": "SF", "payment_plan": "TBD"},
    {"location": "Asokoro", "property_type": "4 Bedroom Terrace Duplex", "finish": "SF", "payment_plan": "TBD"},
    {"location": "Mabushi by Banex Bridge", "property_type": "Detached Duplex with Rooftop", "finish": "SF", "payment_plan": "TBD", "price_ngn": 80000000},
    {"location": "Brick City Valley, Kubwa Express", "property_type": "Site & Services Plot 300 sqm", "finish": "FF", "payment_plan": "TBD", "price_ngn": 15000000},
    {"location": "Brick City Valley, Kubwa Express", "property_type": "Site & Services Plot 305 sqm", "finish": "FF", "payment_plan": "TBD", "price_ngn": 15250000},
    {"location": "Brick City Valley, Kubwa Express", "property_type": "4 Bedroom Detached Duplex", "finish": "FF", "payment_plan": "TBD", "price_ngn": 135000000},
    {"location": "Karsana Estate", "property_type": "4 Bedroom Semi Detached Duplex", "finish": "FF", "payment_plan": "TBD", "price_ngn": 210000000},
    {"location": "Heritage Height, Asokoro", "property_type": "5 Bedroom Villa (Type C)", "finish": "SF", "payment_plan": "TBD", "price_ngn": 800000000},
    {"location": "Heritage Height, Asokoro", "property_type": "3 Bedroom Pent House", "finish": "SF", "payment_plan": "TBD", "price_ngn": 350000000},
    {"location": "Solstice Villa, Kaura", "property_type": "3 Bedroom + BQ", "finish": "FF", "payment_plan": "Outright/12M/18M", "price_12m_ngn": 155000000, "price_18m_ngn": 159000000},
    {"location": "Solstice Villa, Kaura", "property_type": "2 Bedroom + BQ", "finish": "FF", "payment_plan": "Outright/12M/18M", "price_outright_ngn": 160000000, "price_12m_ngn": 125000000, "price_18m_ngn": 130000000},
    {"location": "Prime Villa III, Mabushi", "property_type": "4 Bedroom Terrace Duplex", "finish": "SF", "payment_plan": "Flexible", "price_ngn": 130000000},
    {"location": "Equinox Villa IV, Mabushi", "property_type": "3 Bedroom Flat", "finish": "FF", "payment_plan": "Flexible", "price_ngn": 700000000},
    {"location": "Prime Villa Lifecamp", "property_type": "4 Bedroom Terrace Duplex", "finish": "SF", "payment_plan": "Outright/12M/18M", "price_outright_ngn": 345000000, "price_12m_ngn": 349000000, "price_18m_ngn": 350000000},
    {"location": "Prime Villa V Katampe", "property_type": "5 Bedroom Detached Duplex + BQ", "finish": "FF", "payment_plan": "Outright/12M/18M", "price_outright_ngn": 545000000, "price_12m_ngn": 549000000, "price_18m_ngn": 550000000},
    {"location": "Wuse II", "property_type": "1 Bedroom Luxury Flat", "finish": "FF", "payment_plan": "Outright/12M/18M", "price_outright_ngn": 245000000, "price_12m_ngn": 249000000, "price_18m_ngn": 250000000},
    {"location": "Hutu Exclusive", "property_type": "1 Bedroom Flat", "finish": "FF", "payment_plan": "18 Months", "price_ngn": 26141760},
    {"location": "Hutu Exclusive", "property_type": "2 Bedroom Flat", "finish": "SF", "payment_plan": "12 Months", "price_ngn": 21634560},
    {"location": "Kapital Villa, Guzape", "property_type": "3 Bedroom Flat", "finish": "SF", "payment_plan": "18 Months", "price_ngn": 43809984},
    {"location": "Horizon, Kukwaba", "property_type": "1 Bedroom Flat", "finish": "FF", "payment_plan": "Outright/6M/12M", "price_outright_ngn": 68040000, "price_6m_ngn": 74448000, "price_12m_ngn": 86865000},
    {"location": "Harmony Hills", "property_type": "3 Bedroom Flat", "finish": "SF", "payment_plan": "Outright/6M/12M", "price_outright_ngn": 93230000, "price_6m_ngn": 107883600, "price_12m_ngn": 125864200},
    {"location": "Royal Estate, Sabon Gudu", "property_type": "5 Bedroom Detached", "finish": "SF", "payment_plan": "Outright/6M/12M", "price_outright_ngn": 63500000, "price_6m_ngn": 67056000, "price_12m_ngn": 74371200},
    {"location": "Gudu 2", "property_type": "2 Bedroom Flat", "finish": "SF", "payment_plan": "Outright/6M/12M", "price_outright_ngn": 109990000, "price_6m_ngn": 115489500, "price_12m_ngn": 122088900},
]

for i, row in enumerate(LISTINGS):
    row["id"] = f"TAA-SALE-{i+1:03d}"
    row["source"] = "FOR SALE PROPERTIES TRIPLE A REALTY.pdf"
    row["status"] = "available"
    row["listing_type"] = "sale"

out = {
    "meta": {
        "source_document": "FOR SALE PROPERTIES TRIPLE A REALTY.pdf",
        "company": "Triple A Realty Projects Ltd",
        "extracted_date": "2026-07-16",
        "finish_codes": {"FF": "Fully Finished", "SF": "Shell Finish"},
        "payment_plan_types": ["Outright", "6 Months", "12 Months", "18 Months", "Flexible", "TBD", "On request"],
        "note": "Full document contains 80+ property rows. This seed includes confirmed entries; expand from planning/extractions/FOR_SALE_PROPERTIES_TRIPLE_A_REALTY_pdf.txt",
    },
    "listings": LISTINGS,
}

with open("LISTINGS_SEED.json", "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)

print(f"Wrote {len(LISTINGS)} listings")
