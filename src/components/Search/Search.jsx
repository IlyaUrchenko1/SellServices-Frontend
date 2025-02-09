import { useCallback, useEffect, useMemo, useState } from 'react'
import { AddressSuggestions } from 'react-dadata'
import 'react-dadata/dist/react-dadata.css'
import { useLocation } from 'react-router-dom'
import cities from '../../data/List_of_cities'
import './Search.css'

const INITIAL_STATE = {
  inputs: [],
  values: {
    city: '',
    district: '',
    street: '',
    price: '',
    sortNew: false,
    sortOld: false,
    sortPopular: false
  },
  isSubmitting: false,
  error: null,
  showCityList: false,
  selectedCity: '',
  showDistrict: false,
  dropdownOptions: {}, // Хранит опции для выпадающих списков
  showDropdowns: {}, // Состояния отображения выпадающих списков
  isFormValid: true
}

const PRICE_RANGES = [
  'до 5000 ₽', '5000-10000 ₽', '10000-15000 ₽', '15000-20000 ₽',
  '20000-25000 ₽', '25000-30000 ₽', '30000-35000 ₽', 'от 35000 ₽'
]

const DADATA_TOKEN = '9db66acc64262b755a6cbde8bb766248ccdd3d87'

const Search = () => {
  const { search } = useLocation()
  const [state, setState] = useState(INITIAL_STATE)

  const POPULAR_CITIES = useMemo(() => cities, [])

  // Инициализация параметров из URL
  useEffect(() => {
    const searchParams = new URLSearchParams(search)
    const params = Array.from(searchParams.entries()).map(([type, placeholder]) => {
      const [label, options] = placeholder.split('|').map(s => s.trim())
      const dropdownOptions = options ? options.split(' ').filter(Boolean) : null

      return {
        type,
        placeholder: label,
        id: `${type}-${Math.random()}`,
        hasDropdown: !!dropdownOptions,
        options: dropdownOptions
      }
    })

    setState(prev => ({
      ...prev,
      inputs: params,
      values: {
        ...prev.values,
        ...params.reduce((acc, { type }) => ({ ...acc, [type]: '' }), {})
      },
      dropdownOptions: params.reduce((acc, { type, options }) => {
        if (options) {
          acc[type] = options
        }
        return acc
      }, {}),
      showDropdowns: params.reduce((acc, { type }) => ({ ...acc, [type]: false }), {})
    }))
  }, [search])

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const handleSortChange = useCallback((sortType) => {
    setState(prev => ({
      ...prev,
      values: {
        ...prev.values,
        sortNew: sortType === 'new' ? !prev.values.sortNew : sortType === 'old' ? false : prev.values.sortNew,
        sortOld: sortType === 'old' ? !prev.values.sortOld : sortType === 'new' ? false : prev.values.sortOld,
        sortPopular: sortType === 'popular' ? !prev.values.sortPopular : prev.values.sortPopular
      }
    }))
  }, [])

  const handleInputChange = useCallback((type, value) => {
    setState(prev => {
      const newState = { ...prev }

      switch (type) {
        case 'city': {
          const cityValue = typeof value === 'string' ? value.trim() : ''
          newState.values = {
            ...prev.values,
            city: cityValue,
            district: cityValue ? prev.values.district : '',
            street: cityValue ? prev.values.street : ''
          }
          newState.selectedCity = cityValue
          newState.showCityList = !!cityValue
          break
        }

        case 'street': {
          newState.values = {
            ...prev.values,
            street: value?.data?.street_with_type || value?.value || ''
          }
          break
        }

        case 'district': {
          newState.values = {
            ...prev.values,
            district: value?.data?.city_district_with_type || value?.data?.area_with_type || value?.value || ''
          }
          break
        }

        default: {
          newState.values = {
            ...prev.values,
            [type]: value
          }
        }
      }

      newState.error = null
      return newState
    })
  }, [])

  const toggleDropdown = useCallback((type) => {
    setState(prev => ({
      ...prev,
      showDropdowns: {
        ...prev.showDropdowns,
        [type]: !prev.showDropdowns[type]
      }
    }))
  }, [])

  const toggleCityList = useCallback(() => {
    setState(prev => ({
      ...prev,
      showCityList: !prev.showCityList
    }))
  }, [])

  const handleSearch = useCallback(async () => {
    if (state.isSubmitting) {
      return
    }

    updateState({ isSubmitting: true, error: null })

    try {
      const searchData = {
        ...state.values,
        district: state.values.district || 'Не указан',
        street: state.values.street || 'Не указана',
        city: state.values.city || 'Не указан'
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
  }, [state.isSubmitting, state.values, updateState])

  const filteredCities = useMemo(() => {
    const searchTerm = (state.values.city || '').toLowerCase()
    return POPULAR_CITIES.filter(city =>
      city.toLowerCase().includes(searchTerm)
    )
  }, [state.values.city, POPULAR_CITIES])

  return (
    <div className="search-container">
      <div className="inputs-container">
        {/* Поле выбора города */}
        <div className="input-wrapper city-input-wrapper">
          <input
            type="text"
            className="input-field"
            placeholder="Введите город"
            value={state.values.city}
            onChange={e => handleInputChange('city', e.target.value)}
            onFocus={() => setState(prev => ({ ...prev, showCityList: true }))}
            autoComplete="off"
          />
          <button
            type="button"
            className="city-dropdown-button"
            onClick={toggleCityList}
            aria-label={state.showCityList ? 'Скрыть список городов' : 'Показать список городов'}
          >
            {state.showCityList ? '▲' : '▼'}
          </button>
          {state.showCityList && (
            <div className="city-dropdown">
              {filteredCities.map(city => (
                <div
                  key={city}
                  className="city-option"
                  onClick={() => {
                    handleInputChange('city', city)
                    setState(prev => ({ ...prev, showCityList: false }))
                  }}
                >
                  {city}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Поле улицы */}
        {state.selectedCity && (
          <div className="input-wrapper">
            <AddressSuggestions
              token={DADATA_TOKEN}
              value={state.values.street}
              onChange={(suggestion) => handleInputChange('street', suggestion)}
              inputProps={{
                placeholder: "Введите улицу (необязательно)",
                className: 'react-dadata__input',
                autoComplete: "off"
              }}
              filterLocations={[
                { city: state.selectedCity }
              ]}
              filterFromBound="street"
              filterToBound="house"
              suggestionsLimit={7}
              minChars={3}
            />
          </div>
        )}

        {/* Поле района */}
        {state.selectedCity && (
          <div className="input-wrapper">
            <AddressSuggestions
              token={DADATA_TOKEN}
              value={state.values.district}
              onChange={(suggestion) => handleInputChange('district', suggestion)}
              inputProps={{
                placeholder: "Введите район (необязательно)",
                className: 'react-dadata__input',
                autoComplete: "off"
              }}
              filterLocations={[
                { city: state.selectedCity }
              ]}
              filterFromBound="city_district"
              filterToBound="city_district"
              suggestionsLimit={7}
              minChars={2}
            />
          </div>
        )}

        {/* Поле цены */}
        <div className="input-wrapper">
          <select
            className="input-field"
            value={state.values.price}
            onChange={e => handleInputChange('price', e.target.value)}
          >
            <option value="">Выберите ценовой диапазон</option>
            {PRICE_RANGES.map(range => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>

        {/* Чекбоксы сортировки */}
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

        {/* Динамические поля из URL */}
        {state.inputs.map(({ type, placeholder, id, hasDropdown }) => (
          !['city', 'district', 'street'].includes(type) && (
            <div key={id} className="input-wrapper">
              {hasDropdown ? (
                <div className="dropdown-input-wrapper">
                  <input
                    type="text"
                    className="input-field"
                    placeholder={placeholder}
                    value={state.values[type] || ''}
                    onChange={e => handleInputChange(type, e.target.value)}
                    readOnly
                    onClick={() => toggleDropdown(type)}
                  />
                  <button
                    type="button"
                    className="dropdown-button"
                    onClick={() => toggleDropdown(type)}
                  >
                    {state.showDropdowns[type] ? '▲' : '▼'}
                  </button>
                  {state.showDropdowns[type] && (
                    <div className="dropdown-list">
                      {state.dropdownOptions[type].map(option => (
                        <div
                          key={option}
                          className="dropdown-option"
                          onClick={() => {
                            handleInputChange(type, option)
                            toggleDropdown(type)
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  className="input-field"
                  placeholder={placeholder}
                  value={state.values[type] || ''}
                  onChange={e => handleInputChange(type, e.target.value)}
                />
              )}
            </div>
          )
        ))}
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