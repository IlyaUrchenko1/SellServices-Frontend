import { useCallback, useEffect, useMemo, useState } from 'react'
import { AddressSuggestions } from 'react-dadata'
import 'react-dadata/dist/react-dadata.css'
import { useLocation } from 'react-router-dom'
import './Search.css'

const Search = () => {
  const { search } = useLocation()
  const [state, setState] = useState({
    inputs: [],
    values: {
      city: '',
      district: '',
      price: '',
      sortNew: false,
      sortOld: false,
      sortPopular: false
    },
    isSubmitting: false,
    error: null,
    showDistrict: false
  })

  useEffect(() => {
    const searchParams = new URLSearchParams(search)
    const params = Array.from(searchParams.entries()).map(([type, placeholder]) => ({
      type,
      placeholder,
      id: `${type}-${Math.random()}`
    }))
    setState(prev => ({
      ...prev,
      inputs: params,
      values: {
        ...prev.values,
        ...params.reduce((acc, { type }) => ({ ...acc, [type]: '' }), {})
      }
    }))
  }, [search])

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
        sortNew: sortType === 'new' ? !state.values.sortNew : sortType === 'old' ? false : state.values.sortNew,
        sortOld: sortType === 'old' ? !state.values.sortOld : sortType === 'new' ? false : state.values.sortOld,
        sortPopular: sortType === 'popular' ? !state.values.sortPopular : state.values.sortPopular
      }
    })
  }, [state.values])

  const validateCity = (city) => {
    if (!city) return false
    // Очищаем строку от лишних пробелов
    const trimmedCity = city.trim()
    // Проверяем минимальную длину
    if (trimmedCity.length < 2) return false
    // Проверяем что нет запятых и это одно слово
    return !trimmedCity.includes(',')
  }

  const validateDistrict = (district) => {
    if (!district) return true
    
    const parts = district.split(',').map(part => part.trim())
    if (parts.length !== 2) return false

    // Проверяем каждую часть района на минимальную длину и содержание
    return parts.every(part => {
      const cleaned = part.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, '').trim()
      return cleaned.length >= 2 // Минимум 2 символа для каждой части
    })
  }

  const handleSearch = useCallback(async () => {
    if (state.isSubmitting) return

    updateState({ isSubmitting: true, error: null })

    try {
      const searchData = {
        ...state.values
      }

      if (!validateCity(searchData.city)) {
        updateState({ error: 'Пожалуйста, введите корректное название города (минимум 2 символа, без запятых)' })
        return
      }

      if (state.showDistrict && !validateDistrict(searchData.district)) {
        updateState({ error: 'Пожалуйста, введите район в формате: Город, Район' })
        return
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
  }, [state.isSubmitting, state.values, state.showDistrict])

  const handleInputChange = useCallback((type, value) => {
    if (type === 'city') {
      const cityValue = value.value || ''
      setState(prev => ({
        ...prev,
        values: {
          ...prev.values,
          [type]: cityValue,
          district: !cityValue ? '' : prev.values.district
        },
        showDistrict: cityValue.length > 0,
        error: null
      }))
    } else if (type === 'district') {
      const districtValue = value.value || ''
      setState(prev => ({
        ...prev,
        values: {
          ...prev.values,
          [type]: districtValue
        },
        error: null
      }))
    } else {
      setState(prev => ({
        ...prev,
        values: {
          ...prev.values,
          [type]: value
        },
        error: null
      }))
    }
  }, [])

  return (
    <div className="search-container">
      <div className="inputs-container">
        <div className="input-wrapper">
          <AddressSuggestions
            token="9db66acc64262b755a6cbde8bb766248ccdd3d87"
            value={state.values.city || ''}
            onChange={(value) => handleInputChange('city', value)}
            inputProps={{
              placeholder: "Введите название города",
              className: 'react-dadata__input'
            }}
          />
          {state.showDistrict && (
            <AddressSuggestions
              token="9db66acc64262b755a6cbde8bb766248ccdd3d87"
              value={state.values.district || ''}
              onChange={(value) => handleInputChange('district', value)}
              inputProps={{
                placeholder: "Введите название района",
                className: 'react-dadata__input'
              }}
            />
          )}
        </div>

        <div className="input-wrapper">
          <select
            className="input-field"
            value={state.values.price}
            onChange={e => handleInputChange('price', e.target.value)}
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

        {/* Динамические поля из URL */}
        {state.inputs.map(({ type, placeholder, id }) => (
          type !== 'city' && type !== 'district' && (
            <div key={id} className="input-wrapper">
              <input
                type="text"
                className="input-field"
                placeholder={placeholder}
                value={state.values[type] || ''}
                onChange={e => handleInputChange(type, e.target.value)}
              />
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