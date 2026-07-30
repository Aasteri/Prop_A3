# AWS Budgets — $20 credit + cost alerts for Prop A3

New AWS accounts can earn **$20 in promotional credits** by completing the **“Set up a cost budget using AWS Budgets”** activity in the console. This guide walks through that task and sets sensible alerts for the Prop A3 EC2 server (~**$13–23/month**).

Official reference: [AWS hands-on — Control your costs](https://docs.aws.amazon.com/hands-on/latest/control-your-costs-free-tier-budgets/control-your-costs-free-tier-budgets.html)

---

## Part 1 — Claim the $20 credit

1. Sign in to the [AWS Management Console](https://console.aws.amazon.com/).
2. On the **home dashboard**, find the **Explore AWS** widget (filter: **Earn AWS credits** if needed).
3. Click **Set up a cost budget using AWS Budgets**.
4. You are redirected to **Billing and Cost Management → Budgets**.

### Create the budget (simplified template)

| Step | Choice |
|------|--------|
| Budget setup | **Use a template (simplified)** |
| Template type | **Monthly cost budget** |
| Budget name | `Prop A3 monthly` |
| Budgeted amount | **`25.00` USD** *(Prop A3 runs ~$13 on t3.micro, ~$23 on t3.small)* |
| Email alerts | Your email (alerts at 80% actual and 100% forecast) |

5. Review and **Create budget**.
6. Within ~**10 minutes**, check **Billing → Credits** for the **$20** promotional credit.

> **Tip:** Use **$25/month** rather than $100 so alerts fire early if something misconfigured (extra EBS, forgotten test instance, etc.).

---

## Part 2 — Recommended extra budgets (optional)

After the promotional budget, add:

| Budget | Amount | Why |
|--------|--------|-----|
| **EC2 only** | $15/month | Catches runaway instance types or duplicate VMs |
| **Forecast alert** | 100% of $25 | Email if AWS predicts you will exceed budget this month |

Advanced setup: **Customize (advanced)** → scope to **Service: Amazon Elastic Compute Cloud - Compute** and **Region: eu-west-1** (Ireland, where Prop A3 runs).

---

## Part 3 — Billing alarms (belt and suspenders)

Budgets are the main tool; also set a **CloudWatch billing alarm** (legacy but still useful):

1. **Billing → Billing preferences** → enable **Receive Billing Alerts**.
2. **CloudWatch → Alarms → Create alarm** → **Billing** metric → threshold **$20 USD**.

Note: Billing metrics appear in **us-east-1 (N. Virginia)** only.

---

## Prop A3 expected monthly cost

| Item | ~USD/month |
|------|------------|
| t3.micro EC2 | $7.50 |
| 20 GiB gp3 | $1.60 |
| Elastic IP (attached) | $3.60 |
| **Total (budget tier)** | **~$13** |
| t3.small upgrade | +~$10 |

Your **$100 signup credit** + **$20 Budgets credit** + any exploration credits stretch this significantly.

---

## After credits run out

1. Keep the **$25/month budget** — you get emails before surprises.
2. Consider **Reserved Instance** or **Savings Plan** only after 3+ months stable usage.
3. Review **Cost Explorer** monthly: EC2, EBS, data transfer.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No $20 credit after 30 min | Confirm you used the **Explore AWS** task link (not manual Budgets navigation only) |
| Activity greyed out | Account may have joined an **Organization** or passed the activity deadline — see [Free Tier FAQ](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-FAQ.html) |
| Alerts too noisy | Raise threshold to 90% actual, or scope EC2-only budget |

---

*Prop A3 deploy runbook: [DEPLOY.md](./DEPLOY.md)*
