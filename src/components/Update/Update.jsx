import { useCallback, useEffect, useMemo, useState } from 'react'
import { AddressSuggestions } from 'react-dadata'
import 'react-dadata/dist/react-dadata.css'
import { useLocation } from 'react-router-dom'
import cities from '../../data/List_of_cities'
import './Update.css'

const INITIAL_STATE = {
  inputs: [],
  values: {
    city: '',
    street: '',
    district: '',
    house: '',
    number_phone: '',
    price: ''
  },
  isSubmitting: false,
  error: null,
  success: false,
  showCityList: false,
  selectedCity: '',
  streetSuggestion: null,
  districtSuggestion: null,
  validationMessage: '',
  dropdownOptions: {},
  showDropdowns: {},
  header: ''
}

const DADATA_TOKEN = '9db66acc64262b755a6cbde8bb766248ccdd3d87'

const Update = () => {
  const { search } = useLocation()
  const [state, setState] = useState(INITIAL_STATE)

  const POPULAR_CITIES = useMemo(() => cities, [])

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(search)
      const initialValues = {}

      // Получаем заголовок из параметров
      const header = searchParams.get('header')
      console.log(header)

      // Парсим адрес
      const address = searchParams.get('adress')
      if (address) {
        const [city = '', street = ''] = address.split(',').map(part => {
          return part
            .replace(/^г\s+/, '')
            .replace(/^ул\s+/, '')
            .replace(/^д\s+/, '')
            .trim()
        })

        initialValues.city = city
        initialValues.street = street
      }

      // Парсим остальные параметры и создаем поля для формы
      const params = Array.from(searchParams.entries()).map(([type, value]) => {
        if (type === 'adress' || type === 'header') return null

        const [placeholder, options] = value.split('|').map(s => s.trim())
        const dropdownOptions = options ? options.split(' ').filter(Boolean) : null

        initialValues[type] = decodeURIComponent(placeholder)

        return {
          type,
          placeholder: decodeURIComponent(placeholder),
          required: ['city', 'street', 'number_phone', 'price'].includes(type),
          id: `${type}-${Math.random()}`,
          hasDropdown: !!dropdownOptions,
          options: dropdownOptions
        }
      }).filter(Boolean)

      setState(prev => ({
        ...prev,
        inputs: params,
        values: {
          ...prev.values,
          ...initialValues
        },
        selectedCity: initialValues.city || '',
        header: header ? decodeURIComponent(header) : '',
        dropdownOptions: params.reduce((acc, { type, options }) => {
          if (options) {
            acc[type] = options
          }
          return acc
        }, {}),
        showDropdowns: params.reduce((acc, { type }) => ({ ...acc, [type]: false }), {})
      }))

    } catch (err) {
      console.error('Ошибка при инициализации формы:', err)
      setState(prev => ({ ...prev, error: 'Ошибка при загрузке формы' }))
    }
  }, [search])

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const validateForm = useCallback(() => {
    const requiredFields = state.inputs
      .filter(input => input.required)
      .map(input => input.type)

    const emptyFields = requiredFields.filter(field => {
      const value = state.values[field]
      return !value || value.trim().length === 0
    })

    if (emptyFields.length > 0) {
      const fieldNames = emptyFields.map(field => {
        const input = state.inputs.find(i => i.type === field)
        return input?.placeholder || field
      })
      const message = `Не заполнены обязательные поля: ${fieldNames.join(', ')}`
      updateState({ validationMessage: message, error: message })
      return false
    }

    // Валидация цены
    if (state.values.price) {
      const price = parseFloat(state.values.price)
      if (isNaN(price) || price <= 0) {
        const message = 'Цена должна быть положительным числом'
        updateState({ validationMessage: message, error: message })
        return false
      }
    }

    // Валидация телефона
    const phoneRegex = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/
    if (state.values.number_phone && !phoneRegex.test(state.values.number_phone)) {
      const message = 'Неверный формат номера телефона'
      updateState({ validationMessage: message, error: message })
      return false
    }

    // Валидация заголовка
    if (state.values.title && (state.values.title.length < 5 || state.values.title.length > 100)) {
      const message = 'Заголовок должен содержать от 5 до 100 символов'
      updateState({ validationMessage: message, error: message })
      return false
    }

    updateState({ validationMessage: '', error: null })
    return true
  }, [state.inputs, state.values])

  const formatPhoneNumber = useCallback((value) => {
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''
    if (numbers.length <= 1) return '+7'
    if (numbers.length <= 4) return `+7 (${numbers.slice(1)}`
    if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4)}`
    if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`
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

  const handleInputChange = useCallback((type, value) => {
    setState(prev => {
      const newState = { ...prev }

      switch (type) {
        case 'number_phone': {
          newState.values = {
            ...prev.values,
            [type]: formatPhoneNumber(value)
          }
          break
        }

        case 'city': {
          const cityValue = typeof value === 'string' ? value.trim() : ''
          newState.values = {
            ...prev.values,
            city: cityValue,
            district: '',
            street: ''
          }
          newState.selectedCity = cityValue
          newState.showCityList = !!cityValue
          newState.streetSuggestion = null
          newState.districtSuggestion = null
          break
        }

        case 'street': {
          newState.streetSuggestion = value
          const streetValue = value?.data?.street_with_type || ''
          const houseValue = value?.data?.house || ''
          newState.values = {
            ...prev.values,
            street: houseValue ? `${streetValue}, ${houseValue}` : streetValue,
            house: houseValue
          }
          break
        }

        case 'district': {
          newState.districtSuggestion = value
          newState.values = {
            ...prev.values,
            district: value?.data?.city_district_with_type || value?.data?.area_with_type || ''
          }
          break
        }

        case 'price': {
          const numValue = value.replace(/[^\d]/g, '')
          newState.values = {
            ...prev.values,
            [type]: numValue
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
  }, [formatPhoneNumber])

  const handleUpdate = useCallback(async () => {
    if (state.isSubmitting) return

    if (!validateForm()) return

    updateState({ isSubmitting: true, error: null })

    try {
      const updateData = {
        ...state.values,
        district: state.values.district || 'Не указан',
        street: state.values.street || 'Не указана',
        city: state.values.city || 'Не указан'
      }

      const tg = window?.Telegram?.WebApp
      if (tg) {
        await tg.sendData(JSON.stringify(updateData))
        updateState({ success: true })
      } else {
        console.log('Обновление:', updateData)
        alert(JSON.stringify(updateData, null, 2))
        updateState({ success: true })
      }
    } catch (err) {
      updateState({ error: err.message || 'Ошибка при обновлении' })
    } finally {
      updateState({ isSubmitting: false })
    }
  }, [state.isSubmitting, state.values, validateForm, updateState])

  return (
    <div className="update-container">
      {state.header && (
        <h1 className="page-header">{state.header}</h1>
      )}
      <div className="inputs-container">
        <div className="input-wrapper city-input-wrapper">
          <input
            type="text"
            className="input-field"
            placeholder="Введите город *"
            value={state.values.city}
            onChange={e => handleInputChange('city', e.target.value)}
            onFocus={() => setState(prev => ({ ...prev, showCityList: true }))}
            autoComplete="off"
          />
          <button
            type="button"
            className="city-dropdown-button"
            onClick={() => setState(prev => ({ ...prev, showCityList: !prev.showCityList }))}
          >
            {state.showCityList ? '▲' : '▼'}
          </button>
          {state.showCityList && (
            <div className="city-dropdown">
              {POPULAR_CITIES.filter(city =>
                city.toLowerCase().includes((state.values.city || '').toLowerCase())
              ).map(city => (
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

        {state.selectedCity && (
          <div className="input-wrapper">
            <AddressSuggestions
              token={DADATA_TOKEN}
              value={state.streetSuggestion}
              onChange={(suggestion) => handleInputChange('street', suggestion)}
              inputProps={{
                placeholder: "Введите улицу *",
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
              renderOption={(suggestion) => {
                const { street_with_type, house } = suggestion.data
                return house ? `${street_with_type}, ${house}` : street_with_type
              }}
            />
          </div>
        )}

        {state.selectedCity && (
          <div className="input-wrapper">
            <AddressSuggestions
              token={DADATA_TOKEN}
              value={state.districtSuggestion}
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

        {state.inputs.map(({ type, placeholder, id, hasDropdown, required }) => (
          !['city', 'district', 'street'].includes(type) && (
            <div key={id} className="input-wrapper">
              {hasDropdown ? (
                <div className="dropdown-input-wrapper">
                  <input
                    type="text"
                    className="input-field"
                    placeholder={`${placeholder}${required ? ' *' : ''}`}
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
              ) : type === 'number_phone' ? (
                <input
                  type="tel"
                  className="input-field"
                  placeholder={`${placeholder}${required ? ' *' : ''}`}
                  value={state.values[type] || ''}
                  onChange={e => handleInputChange(type, e.target.value)}
                  maxLength={18}
                  autoComplete="tel"
                />
              ) : (
                <input
                  type={type === 'price' ? 'number' : 'text'}
                  className="input-field"
                  placeholder={`${placeholder}${required ? ' *' : ''}`}
                  value={state.values[type] || ''}
                  onChange={e => handleInputChange(type, e.target.value)}
                  autoComplete="off"
                  min={type === 'price' ? "1" : undefined}
                />
              )}
            </div>
          )
        ))}
      </div>

      {state.error && <div className="error-message">{state.error}</div>}
      {state.success && <div className="success-message">Данные успешно обновлены!</div>}
      <button
        className="update-button"
        onClick={handleUpdate}
        disabled={state.isSubmitting}
      >
        {state.isSubmitting ? 'Обновление...' : 'Сохранить изменения'}
      </button>
      <div className="form-note">* - обязательные поля</div>
    </div>
  )
}

export default Update