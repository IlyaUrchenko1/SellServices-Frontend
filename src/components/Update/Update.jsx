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

  // Инициализация входных данных из URL
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

  // Форматирование номера телефона
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''

    if (numbers.length <= 1) return '+7'
    if (numbers.length <= 4) return `+7 (${numbers.slice(1)}`
    if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4)}`
    if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`
  }

  // Обработка изменений полей
  const handleInputChange = useCallback((type, value) => {
    if (type === 'number_phone') {
      const formattedNumber = formatPhoneNumber(value)
      setInputValues(prev => ({ ...prev, [type]: formattedNumber }))
    } else {
      setInputValues(prev => ({ ...prev, [type]: typeof value === 'object' ? value.value : value }))
    }
    // Сбрасываем ошибку при изменении любого поля
    setError(null)
  }, [])

  // Отправка данных
  const handleUpdate = useCallback(async () => {
    setIsSubmitting(true)
    try {
      // Фильтруем пустые значения перед отправкой
      const filteredValues = Object.fromEntries(
        Object.entries(inputValues).filter(([value]) => value !== '')
      )

      const jsonData = JSON.stringify(filteredValues)
      const tg = window.Telegram?.WebApp

      if (tg) {
        await tg.sendData(jsonData)
        setSuccess(true)
      } else {
        console.log('Данные для обновления:', filteredValues)
        alert(
          `Данные для обновления:\n${Object.entries(filteredValues)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n')}`
        )
        setSuccess(true)
      }
    } catch (err) {
      console.error('Ошибка при обновлении данных:', err)
      setError('Произошла ошибка при обновлении. Попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }, [inputValues])

  // Рендер формы
  const formInputs = useMemo(() => (
    <div className="inputs-container">
      {inputs.map(({ type, placeholder, id }) => (
        <div key={id} className="input-wrapper">
          {type === 'adress' ? (
            <AddressSuggestions
              token="9db66acc64262b755a6cbde8bb766248ccdd3d87"
              value={inputValues[type] || ''}
              onChange={(value) => handleInputChange(type, value)}
              inputProps={{
                placeholder: `${placeholder} (необязательно)`,
                className: 'react-dadata__input'
              }}
            />
          ) : type === 'number_phone' ? (
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
  ), [inputs, inputValues, handleInputChange])

  return (
    <div className="update-container">
      {formInputs}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Данные успешно обновлены!</div>}
      <button
        className="update-button"
        onClick={handleUpdate}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Обновление...' : 'Сохранить изменения'}
      </button>
    </div>
  )
}

export default Update