const axios = require("axios");

// Smart mapping for unrecognized ground locations to nearby cities
const LOCATION_MAPPING = {
  "pollmura": "Balangoda",
  "pollamura": "Balangoda",
  "pollamura school ground": "Balangoda"
};

/**
 * Fetches weather information for a specific location.
 * Uses OpenWeatherMap Free Tier.
 * 
 * @param {string} location - Name of the city/location.
 * @param {Date} date - The date of the tournament.
 * @returns {Promise<Object|null>} - Weather data or null.
 */
const getWeatherByLocation = async (location, date) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ No OPENWEATHER_API_KEY found in .env");
      return null;
    }

    // 1. Pre-process Location (Mapping & Clean-up)
    const normalizedLocation = location.toLowerCase().trim();
    let searchLocation = LOCATION_MAPPING[normalizedLocation] || location;
    
    // Always append country code for better accuracy in Sri Lanka
    const searchQuery = `${searchLocation}, SL`;

    // 2. Get Coordinates (Geocoding API)
    const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchQuery)}&limit=1&appid=${apiKey}`;
    const geoRes = await axios.get(geoUrl);

    if (!geoRes.data || geoRes.data.length === 0) {
      console.warn(`⚠️ Could not find coordinates for: ${searchQuery}`);
      // Final fallback: try just the location name
      const geoUrlFallback = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchLocation)}&limit=1&appid=${apiKey}`;
      const geoResFallback = await axios.get(geoUrlFallback);
      if (!geoResFallback.data || geoResFallback.data.length === 0) return null;
      var { lat, lon } = geoResFallback.data[0];
    } else {
      var { lat, lon } = geoRes.data[0];
    }

    // 3. Fetch Forecast or Current Weather
    const targetTimestamp = new Date(date).getTime() / 1000;
    const currentTimestamp = Date.now() / 1000;
    
    // OpenWeatherMap Free level only provides a 5-day forecast.
    // If the date is beyond 5 days, we'll fetch the CURRENT weather as a reference.
    const isWithin5Days = (targetTimestamp - currentTimestamp) < 432000; // 5 days in seconds

    if (isWithin5Days && targetTimestamp > currentTimestamp) {
        // Fetch 5 Day / 3 Hour Forecast
        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const weatherRes = await axios.get(weatherUrl);

        if (weatherRes.data && weatherRes.data.list) {
            let closestForecast = weatherRes.data.list[0];
            let minDiff = Math.abs(targetTimestamp - closestForecast.dt);

            for (const forecast of weatherRes.data.list) {
              const diff = Math.abs(targetTimestamp - forecast.dt);
              if (diff < minDiff) {
                minDiff = diff;
                closestForecast = forecast;
              }
            }

            return {
              temp: closestForecast.main.temp,
              condition: closestForecast.weather[0].main,
              description: closestForecast.weather[0].description,
              icon: `http://openweathermap.org/img/wn/${closestForecast.weather[0].icon}@2x.png`,
              is_accurate: true,
              source: "forecast"
            };
        }
    }

    // Default Fallback: Fetch Current Weather
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const curRes = await axios.get(currentUrl);
    
    if (!curRes.data) return null;

    return {
      temp: curRes.data.main.temp,
      condition: curRes.data.weather[0].main,
      description: curRes.data.weather[0].description,
      icon: `http://openweathermap.org/img/wn/${curRes.data.weather[0].icon}@2x.png`,
      is_accurate: false, // Too far away/Historical reference
      source: "current"
    };

  } catch (err) {
    if (err.code === "ECONNRESET") {
      console.warn("⚠️ Weather API Connection Reset (ECONNRESET). This is usually a temporary network issue.");
    } else {
      console.error("❌ Weather API Error:", err.message);
    }
    return null;
  }
};

module.exports = { getWeatherByLocation };
