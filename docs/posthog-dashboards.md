# PostHog Dashboards Setup

> Configuration manuelle dans eu.posthog.com — ces dashboards ne sont pas
> gérés par code. Ce fichier sert de référence pour les recréer ou les
> auditer après une migration de projet PostHog.

---

## Dashboard 1 : "Mira Acquisition"

### Insight 1 — Visites par jour
| Champ | Valeur |
|---|---|
| Type | Trends |
| Event | `$pageview` |
| Breakdown | Par jour |
| Période | 30 derniers jours |

---

### Insight 2 — Sources de trafic (UTM)
| Champ | Valeur |
|---|---|
| Type | Trends |
| Event | `$pageview` — filter `pathname = "/"` |
| Breakdown | `utm_source` |
| Visualisation | Bar chart |

---

### Insight 3 — Top créatrices TikTok
| Champ | Valeur |
|---|---|
| Type | Trends |
| Event | `$pageview` |
| Filter | `utm_source = "tiktok"` |
| Breakdown | `utm_campaign` |
| Période | 7 derniers jours |

---

### Insight 4 — Funnel d'acquisition complet
| Champ | Valeur |
|---|---|
| Type | Funnel |
| Step 1 | `landing_viewed` |
| Step 2 | `name_step_completed` |
| Step 3 | `photo_uploaded` |
| Step 4 | `analysis_completed` |
| Step 5 | `signup_completed` |

---

### Insight 5 — Conversion landing → signup par source
| Champ | Valeur |
|---|---|
| Type | Funnel |
| Step 1 | `landing_viewed` |
| Step 2 | `signup_completed` |
| Breakdown | `utm_source` |

---

## Dashboard 2 : "Mira Conversion"

### Insight 6 — Funnel paywall → paid
| Champ | Valeur |
|---|---|
| Type | Funnel |
| Step 1 | `paywall_viewed` |
| Step 2 | `plan_selected` |
| Step 3 | `checkout_initiated` |
| Step 4 | `checkout_completed` |

---

### Insight 7 — Conversion par plan choisi
| Champ | Valeur |
|---|---|
| Type | Trends |
| Event | `checkout_completed` |
| Breakdown | `plan` |
| Visualisation | Pie chart |

---

### Insight 8 — Trial → Paid conversion rate
| Champ | Valeur |
|---|---|
| Type | Funnel |
| Step 1 | `subscription_created_server` — filter `status = "trialing"` |
| Step 2 | `trial_converted` |

---

### Insight 9 — Revenue par jour
| Champ | Valeur |
|---|---|
| Type | Trends |
| Event | `checkout_completed` |
| Math | Sum of property `value` |
| Breakdown | Par jour |

---

## Dashboard 3 : "Mira Retention"

### Insight 10 — Daily Active Users (DAU)
| Champ | Valeur |
|---|---|
| Type | Trends |
| Event | `dashboard_viewed` |
| Math | Unique users |
| Période | 30 derniers jours |

---

### Insight 11 — Routine usage par utilisatrice
| Champ | Valeur |
|---|---|
| Type | Trends |
| Event | `routine_viewed` |
| Math | Total events / Unique users |
| Période | 7 derniers jours |

---

### Insight 12 — Cohort retention (Day 1, 7, 14, 30)
| Champ | Valeur |
|---|---|
| Type | Retention |
| Cohort d'entrée | Users who triggered `signup_completed` |
| Action de rétention | `dashboard_viewed` |
| Périodes | Day 1, Day 7, Day 14, Day 30 |

---

### Insight 13 — Clics produits affiliés
| Champ | Valeur |
|---|---|
| Type | Trends |
| Event | `product_clicked` |
| Breakdown | `affiliate_partner` |
| Math | Total events |

---

## Dashboard 4 : "Mira Churn"

### Insight 14 — Cancellations par raison
| Champ | Valeur |
|---|---|
| Type | Trends |
| Event | `cancellation_feedback_submitted` |
| Breakdown | `reason` |
| Visualisation | Bar chart horizontal |

---

### Insight 15 — Jours utilisés avant annulation
| Champ | Valeur |
|---|---|
| Type | Trends |
| Event | `subscription_cancellation_scheduled` |
| Math | Average of property `days_used` |

---

### Insight 16 — Cancellation funnel
| Champ | Valeur |
|---|---|
| Type | Funnel |
| Step 1 | `billing_page_viewed` |
| Step 2 | `billing_portal_opened` |
| Step 3 | `subscription_cancellation_scheduled` |

---

## Cohorts à créer dans PostHog

### Cohort 1 — "Premium users active"
- Users who triggered `subscription_started` in last 90 days
- AND person property `has_subscription = true`

### Cohort 2 — "Trial users"
- Users who triggered `signup_completed` in last 7 days
- AND person property `subscription_status = "trialing"`

### Cohort 3 — "TikTok acquired users"
- Users who triggered `$pageview` with property `utm_source = "tiktok"`

### Cohort 4 — "High value users"
- Users who triggered `product_clicked` more than 5 times (lifetime)

### Cohort 5 — "At-risk churners"
- Person property `subscription_status = "active"`
- AND did NOT trigger `dashboard_viewed` in last 7 days

---

## Alertes PostHog à configurer

### Alerte 1 — Drop de conversion
- **Condition** : Taux `signup_completed / landing_viewed` < 5% sur 24h
- **Notification** : Email

### Alerte 2 — Spike de cancellations
- **Condition** : > 5 events `cancellation_feedback_submitted` en 24h
- **Notification** : Email

### Alerte 3 — Vidéo TikTok virale
- **Condition** : > 100 `landing_viewed` en 1h avec `utm_source = "tiktok"`
- **Notification** : Email immédiate

---

## Events de référence

Liste complète des events trackés dans l'app, avec leurs propriétés.

### Onboarding
| Event | Propriétés |
|---|---|
| `landing_viewed` | `source`, `referrer` |
| `landing_cta_clicked` | — |
| `name_step_viewed` | — |
| `name_step_completed` | `name_length` |
| `upload_step_viewed` | — |
| `photo_selected` | `file_size_kb`, `file_type` |
| `photo_upload_started` | — |
| `analysis_started` | — |
| `photo_uploaded` | `duration_ms` |
| `analysis_completed` | `duration_ms` |
| `photo_upload_failed` | `reason` |
| `analysis_failed` | `reason`, `retry_count` |

### Auth
| Event | Propriétés |
|---|---|
| `signup_modal_viewed` | — |
| `signup_started` | `method` |
| `signup_completed` | `method`, `utm_source`, `utm_campaign` |
| `signup_failed` | `reason` |

### Résultat & Paywall
| Event | Propriétés |
|---|---|
| `result_viewed` | `has_subscription`, `skin_type`, `concerns_count` |
| `paywall_viewed` | `scroll_depth_percent` |
| `paywall_card_viewed` | `has_lifetime_available` |
| `plan_selected` | `plan`, `price` |
| `checkout_initiated` | `plan`, `has_trial`, `price` |
| `checkout_failed` | `plan`, `reason` |
| `checkout_dismissed` | `plan_was_selected` |
| `checkout_completed` | `plan`, `value`, `currency`, `has_trial` |
| `subscription_started` | `plan`, `value` |
| `checkout_canceled` | `reason` |

### Dashboard & Usage
| Event | Propriétés |
|---|---|
| `dashboard_viewed` | `is_returning`, `days_since_signup`, `subscription_status` |
| `routine_viewed` | `routine_time`, `time_of_day` |
| `product_clicked` | `product_id`, `product_name`, `brand`, `category`, `price`, `routine_time` |
| `new_analysis_initiated` | `days_since_last` |
| `share_button_clicked` | — |
| `send_card_shared` | `platform` |

### Billing & Churn
| Event | Propriétés |
|---|---|
| `billing_page_viewed` | — |
| `billing_portal_opened` | — |
| `cancellation_feedback_submitted` | `reason`, `custom_text`, `days_subscribed` |
| `cancellation_aborted` | `reason_clicked` |
| `canceled_user_returned` | — |

### Serveur (posthog-node, via webhook Stripe)
| Event | Propriétés |
|---|---|
| `subscription_created_server` | `plan`, `status`, `trial_end` |
| `subscription_cancellation_scheduled` | `plan`, `days_used`, `cancel_at` |
| `subscription_reactivated` | `plan`, `status` |
| `subscription_canceled` | `reason` |
| `trial_converted` | `plan`, `value` |
| `payment_failed_server` | `amount`, `attempt` |
