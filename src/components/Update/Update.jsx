import { useCallback, useEffect, useMemo, useState } from 'react'
import { AddressSuggestions } from 'react-dadata'
import 'react-dadata/dist/react-dadata.css'
import { useLocation } from 'react-router-dom'
import './Update.css'

const Update = () => {
  const { search } = useLocation()
  const [inputs, setInputs] = useState([])
  const [inputValues, setInputValues] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showDistrict, setShowDistrict] = useState(false)

  useEffect(() => {
    const searchParams = new URLSearchParams(search)
    const params = Array.from(searchParams.entries()).map(([type, placeholder]) => ({
      type,
      placeholder,
      id: `${type}-${Math.random()}`
    }))
    setInputs(params)

    const initialValues = params.reduce((acc, { type }) => ({ ...acc, [type]: '' }), {})
    setInputValues(initialValues)
  }, [search])

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''

    if (numbers.length <= 1) return '+7'
    if (numbers.length <= 4) return `+7 (${numbers.slice(1)}`
    if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4)}`
    if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`
  }

  const handleInputChange = useCallback((type, value) => {
    setError(null)
    setSuccess(false)

    if (type === 'number_phone') {
      const formattedNumber = formatPhoneNumber(value)
      setInputValues(prev => ({ ...prev, [type]: formattedNumber }))
    } else if (type === 'adress') {
      const addressValue = value.value || ''
      setInputValues(prev => ({ ...prev, [type]: addressValue }))
      setShowDistrict(addressValue.length > 0)
      if (!addressValue) {
        setInputValues(prev => ({ ...prev, district: '' }))
      }
    } else if (type === 'district') {
      const districtValue = value.value || ''
      setInputValues(prev => ({ ...prev, [type]: districtValue }))
    } else {
      setInputValues(prev => ({ ...prev, [type]: typeof value === 'object' ? value.value : value }))
    }
  }, [])

  const validateAddress = (address) => {
    if (!address) return true // Разрешаем пустой адрес для необязательных полей

    const parts = address.split(',').map(part => part.trim())
    if (parts.length !== 3) return false

    // Проверяем каждую часть адреса на минимальную длину и содержание
    return parts.every(part => {
      const cleaned = part.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, '').trim()
      return cleaned.length >= 2 // Минимум 2 символа для каждой части
    })
  }

  const validateDistrict = (district) => {
    if (!district) return true // Разрешаем пустой район для необязательных полей

    const parts = district.split(',').map(part => part.trim())
    if (parts.length !== 2) return false

    // Проверяем каждую часть района на минимальную длину и содержание
    return parts.every(part => {
      const cleaned = part.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, '').trim()
      return cleaned.length >= 2 // Минимум 2 символа для каждой части
    })
  }

  const validatePhoneNumber = (phone) => {
    if (!phone) return true // Разрешаем пустой телефон для необязательных полей
    const phonePattern = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/
    return phonePattern.test(phone)
  }

  const validate = useCallback(() => {
    setSuccess(false)
    setError(null)

    // Проверяем все поля на корректность формата
    for (const [fieldType, value] of Object.entries(inputValues)) {
      if (value) { // Проверяем только заполненные поля
        if (fieldType === 'adress' && !validateAddress(value)) {
          setError('Неверный формат адреса. Требуется: Город, улица, дом')
          return false
        }

        if (fieldType === 'district' && !validateDistrict(value)) {
          setError('Неверный формат района. Требуется: Город, район')
          return false
        }

        if (fieldType === 'number_phone' && !validatePhoneNumber(value)) {
          setError('Неверный формат номера телефона')
          return false
        }
      }
    }

    // Проверяем зависимость district от adress
    if (inputValues.district && !inputValues.adress) {
      setError('Нельзя указать район без адреса')
      return false
    }

    return true
  }, [inputValues])

  const handleUpdate = useCallback(async () => {
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const filteredValues = Object.fromEntries(
        Object.entries(inputValues).filter(([value]) => value !== '')
      )

      const jsonData = JSON.stringify(filteredValues)
      const tg = window.Telegram?.WebApp

      if (tg) {
        await tg.sendData(jsonData)
        setError(null)
        setSuccess(true)
      } else {
        console.log('Telegram WebApp не доступен, данные:', filteredValues)
        alert(
          `Данные для обновления:\n${Object.entries(filteredValues)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n')}`
        )
        setError(null)
        setSuccess(true)
      }
    } catch (err) {
      console.error('Ошибка при обновлении данных:', err)
      setSuccess(false)
      setError('Произошла ошибка при обновлении. Попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }, [inputValues, validate])

  const formInputs = useMemo(() => (
    <div className="inputs-container">
      {inputs.map(({ type, placeholder, id }) => (
        <div key={id} className="input-wrapper">
          {type === 'adress' ? (
            <>
              <AddressSuggestions
                token="9db66acc64262b755a6cbde8bb766248ccdd3d87"
                value={inputValues[type] || ''}
                onChange={(value) => handleInputChange(type, value)}
                inputProps={{
                  placeholder: "Укажите полный адрес (пример: Город, улица, дом)",
                  className: 'react-dadata__input'
                }}
              />
              {showDistrict && (
                <AddressSuggestions
                  token="9db66acc64262b755a6cbde8bb766248ccdd3d87"
                  value={inputValues.district || ''}
                  onChange={(value) => handleInputChange('district', value)}
                  inputProps={{
                    placeholder: "Укажите район города (пример: Город, район)",
                    className: 'react-dadata__input'
                  }}
                />
              )}
            </>
          ) : type === 'district' ? null : type === 'number_phone' ? (
            <input
              type="tel"
              className="input-field"
              placeholder={`${placeholder} (необязательно)`}
              value={inputValues[type] || ''}
              onChange={e => handleInputChange(type, e.target.value)}
              maxLength={18}
            />
          ) : (
            <input
              type="text"
              className="input-field"
              placeholder={`${placeholder} (необязательно)`}
              value={inputValues[type] || ''}
              onChange={e => handleInputChange(type, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  ), [inputs, inputValues, handleInputChange, showDistrict])

  return (
    <div className="create-container">
      {formInputs}
      {error && <div className="error-message">{error}</div>}
      {!error && success && <div className="success-message">Данные успешно обновлены!</div>}
      <button
        className="create-button"
        onClick={handleUpdate}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Обновление...' : 'Сохранить изменения'}
      </button>
    </div>
  )
}

export default Update