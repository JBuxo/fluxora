# Next Up

## Weather API integration

**What:** Add daily temperature data as a regressor to the Prophet forecast model.

**Why:** Temperature explains 40–60% of day-to-day energy variance in homes with electric heating or air conditioning. Without it, the model can't distinguish "cold day → high heating demand" from an anomaly — all unexplained variance becomes uncertainty width.

**End goal:**
- Tighter confidence bands (99% CI currently ~10 kWh wide → could halve this)
- More accurate anomaly detection (fewer false positives from seasonal weather swings)
- Better end-of-month bill estimates, especially in winter/summer peaks
- Foundation for weather-aware recommendations ("next week is cold, expect +20% bill")

**Implementation sketch:**
- Fetch historical daily max/min temp for the home's location from a weather API (Open-Meteo is free, no key required)
- Store in a `weather_record` table keyed by (home_id, date)
- Add `temperature` as a Prophet regressor alongside occupants/WFH
- Fetch forecast temperature for the next 30 days at sync time for the forward prediction window

---

## Prophet model improvements (tighten 99% CI without changing interval)

### Spanish public holidays
Add Prophet's built-in holiday support for Spain. Holidays cause anomalous consumption (home all day, different routine) — without them the model treats holiday spikes as noise, widening the band.
```python
model.add_country_holidays(country_name='ES')
```

### Multiplicative seasonality
Switch from additive to multiplicative seasonal mode. Energy consumption scales proportionally with season (winter is 2× baseline, not baseline +5 kWh). Better fit → tighter residuals → narrower CI.
```python
Prophet(..., seasonality_mode='multiplicative')
```

### More Fourier terms for yearly seasonality
Default is 10 terms. Bumping to 20 lets Prophet fit finer seasonal patterns (back-to-school September dip, summer vacation, etc.). More explained variance = tighter uncertainty.
```python
Prophet(..., yearly_seasonality=20)
```

### Tariff period regressor (2.0TD)
Spanish P1/P2/P3 pricing causes price-conscious users to shift loads (laundry, EV charging) to cheap hours. Encoding tariff period as a daily weighted score explains behavioral variance the model currently treats as noise.
