import React, { useState } from 'react';
import './App.css';

function App() {
  const [location, setLocation] = useState('');
  const [weatherData, setWeatherData] = useState({
    description: '',
    temperature: '',
    humidity: '',
    rainChances: '',
    suggestions: '',
    weatherCode: null,
    cityName: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCoordinates = async (cityName) => {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}`;
    const response = await fetch(geoUrl);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return { 
        lat: data.results[0].latitude, 
        lon: data.results[0].longitude,
        name: data.results[0].name,
        country: data.results[0].country
      };
    } else {
      throw new Error('City not found');
    }
  };

  const getWeather = async () => {
    setLoading(true);
    try {
      setErrorMessage('');
      
      const coords = await fetchCoordinates(location);
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&hourly=relativehumidity_2m,precipitation&timezone=auto`;
      
      const response = await fetch(weatherUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const getWeatherDescription = (code) => {
        const weatherCodes = {
          0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
          45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
          55: 'Dense drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
          80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers'
        };
        return weatherCodes[code] || 'Unknown weather';
      };

      const weatherDescription = getWeatherDescription(data.current_weather.weathercode);
      const temperature = data.current_weather.temperature;
      const humidity = data.hourly.relativehumidity_2m[0];
      const precipitation = data.hourly.precipitation[0];
      const rainChances = precipitation > 0 ? `Rain: ${precipitation}mm` : 'No Rain';
      const suggestions = getWeatherSuggestions(temperature);

      setWeatherData({
        description: weatherDescription,
        temperature: `${temperature}°C`,
        humidity: `${humidity}%`,
        rainChances: rainChances,
        suggestions: suggestions.join(', '),
        weatherCode: data.current_weather.weathercode,
        cityName: `${coords.name}, ${coords.country}`
      });

    } catch (error) {
      console.error('Error fetching weather data:', error);
      setErrorMessage(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const getWeatherSuggestions = (temperature) => {
    if (temperature < 10) {
      return ['Wear a heavy jacket', 'Bring an umbrella'];
    } else if (temperature < 20) {
      return ['Bring a light jacket', 'Consider an umbrella'];
    } else {
      return ['Enjoy the weather', 'Sunscreen might be a good idea'];
    }
  };

  return (
    <div className={`App ${weatherData.weatherCode !== null ? `weather-${getWeatherTheme(weatherData.weatherCode)}` : ''}`}>
      {/* Animated Background Elements */}
      <div className="animated-background">
        <div className="sun"></div>
        <div className="cloud cloud1"></div>
        <div className="cloud cloud2"></div>
        <div className="cloud cloud3"></div>
        {weatherData.weatherCode >= 61 && <div className="rain-container"></div>}
        {weatherData.weatherCode === 0 && <div className="particles"></div>}
      </div>

      <div className="weather-dashboard">
        <h1 className="app-title">
          <span className="weather-icon">🌤️</span>
          Weather Now
        </h1>
        
        <div id="weather-container">
          <div className="search-section">
            <label htmlFor="location">Enter Location:</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="location"
                placeholder="Enter city name"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && getWeather()}
              />
              <button 
                onClick={getWeather} 
                disabled={loading || location.trim() === ''}
                className={loading ? 'loading' : ''}
              >
                {loading ? '🔄' : '🔍'} {loading ? 'Loading...' : 'Get Weather'}
              </button>
            </div>
          </div>

          {weatherData.cityName && (
            <div className="weather-info-section">
              <h2 className="city-name">{weatherData.cityName}</h2>
              
              <div className="main-weather-display">
                <div className="temperature-display">
                  <span className="temp-number">{weatherData.temperature}</span>
                  <div className="weather-icon-display">
                    {getWeatherIcon(weatherData.weatherCode)}
                  </div>
                </div>
                <div className="weather-description-main">{weatherData.description}</div>
              </div>

              <div className="weather-details-grid">
                <div className="weather-card humidity-card">
                  <div className="card-icon">💧</div>
                  <div className="card-content">
                    <span className="card-label">Humidity</span>
                    <span className="card-value">{weatherData.humidity}</span>
                  </div>
                </div>
                
                <div className="weather-card rain-card">
                  <div className="card-icon">🌧️</div>
                  <div className="card-content">
                    <span className="card-label">Precipitation</span>
                    <span className="card-value">{weatherData.rainChances}</span>
                  </div>
                </div>
              </div>

              <div className="suggestions-card">
                <div className="card-icon">💡</div>
                <div className="card-content">
                  <span className="card-label">Suggestions</span>
                  <span className="card-value">{weatherData.suggestions}</span>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div id="error-message">{errorMessage}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getWeatherTheme(code) {
  if (code === 0 || code === 1) return 'sunny';
  if (code >= 2 && code <= 3) return 'cloudy';
  if (code >= 61 && code <= 82) return 'rainy';
  return 'default';
}

function getWeatherIcon(code) {
  const icons = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️',
    55: '🌦️', 61: '🌧️', 63: '🌧️', 65: '⛈️',
    80: '🌦️', 81: '🌧️', 82: '⛈️'
  };
  return icons[code] || '🌡️';
}

export default App;
