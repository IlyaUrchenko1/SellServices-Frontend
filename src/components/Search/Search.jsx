import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './Search.css'

const Search = () => {
  const { search } = useLocation()
  const [state, setState] = useState({
    inputs: [],
    values: {
      city: '',
      price: '',
      sortNew: false,
      sortOld: false,
      sortPopular: false
    },
    isSubmitting: false,
    error: null,
    showCityList: false,
    cityQuery: ''
  })

  const cities = useMemo(() => [
    'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург',
    'Казань', 'Нижний Новгород', 'Челябинск', 'Самара', 'Омск',
    'Ростов-на-Дону', 'Уфа', 'Красноярск', 'Воронеж', 'Пермь', 
    'Волгоград'
  ], [])

  const priceRanges = useMemo(() => [
    'до 5000 ₽', '5000-10000 ₽', '10000-15000 ₽', '15000-20000 ₽',
    '20000-25000 ₽', '25000-30000 ₽', '30000-35000 ₽', 'от 35000 ₽'
  ], [])

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const handleSortChange = useCallback((sortType) => {
    updateState({
      values: {
        ...state.values,
        // Если выбран новый или старый, то сбрасываем противоположный
        sortNew: sortType === 'new' ? !state.values.sortNew : sortType === 'old' ? false : state.values.sortNew,
        sortOld: sortType === 'old' ? !state.values.sortOld : sortType === 'new' ? false : state.values.sortOld,
        // Остальные сортировки можно комбинировать
        sortPopular: sortType === 'popular' ? !state.values.sortPopular : state.values.sortPopular
      }
    })
  }, [state.values])

  const handleSearch = useCallback(async () => {
    if (state.isSubmitting) return
    
    updateState({ isSubmitting: true, error: null })

    try {
      const searchData = {
        ...state.values,
        city: state.values.city?.trim(),
        price: state.values.price
      }

      if (!searchData.city || searchData.city.length < 2) {
        throw new Error('Выберите город')
      }

      const tg = window?.Telegram?.WebApp
      if (tg) {
        await tg.sendData(JSON.stringify(searchData))
      } else {
        console.log('Поиск:', searchData)
        alert(JSON.stringify(searchData, null, 2))
      }
    } catch (err) {
      updateState({ error: err.message || 'Ошибка поиска' })
    } finally {
      updateState({ isSubmitting: false })
    }
  }, [state.isSubmitting, state.values])

  const filteredCities = useMemo(() => 
    !state.cityQuery ? cities : 
    cities.filter(city => city.toLowerCase().includes(state.cityQuery.toLowerCase())),
    [cities, state.cityQuery]
  )

  return (
    <div className="search-container">
      <div className="inputs-container">
        <div className="input-wrapper">
          <div className="city-input-container">
            <input
              type="text"
              className="input-field"
              placeholder="Выберите город"
              value={state.cityQuery}
              onChange={e => updateState({
                cityQuery: e.target.value,
                values: { ...state.values, city: e.target.value },
                showCityList: true
              })}
              onFocus={() => updateState({ showCityList: true })}
            />
            {state.showCityList && (
              <div className="city-list">
                {filteredCities.map(city => (
                  <div
                    key={city}
                    className="city-list-item"
                    onClick={() => updateState({
                      values: { ...state.values, city },
                      cityQuery: city,
                      showCityList: false
                    })}
                  >
                    {city}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="input-wrapper">
          <select 
            className="input-field"
            value={state.values.price}
            onChange={e => updateState({
              values: { ...state.values, price: e.target.value }
            })}
          >
            <option value="">Выберите ценовой диапазон</option>
            {priceRanges.map(range => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>

        <div className="input-wrapper">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={state.values.sortNew}
              onChange={() => handleSortChange('new')}
            />
            Сначала новые
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox" 
              checked={state.values.sortOld}
              onChange={() => handleSortChange('old')}
            />
            Сначала старые
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={state.values.sortPopular}
              onChange={() => handleSortChange('popular')}
            />
            Сначала популярные
          </label>
        </div>
      </div>

      {state.error && <div className="error-message">{state.error}</div>}
      <button 
        className="search-button"
        onClick={handleSearch}
        disabled={state.isSubmitting}
      >
        {state.isSubmitting ? 'Поиск...' : 'Найти'}
      </button>
    </div>
  )
}

export default Search