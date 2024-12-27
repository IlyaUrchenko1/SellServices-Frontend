import { useEffect, useState, useCallback, useMemo } from 'react'
import { AddressSuggestions } from 'react-dadata'
import 'react-dadata/dist/react-dadata.css'
import { useLocation } from 'react-router-dom'
import './Create.css'

const Create = () => {
	const { search } = useLocation()
	const [inputs, setInputs] = useState([])
	const [inputValues, setInputValues] = useState({})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState(null)
	const [success, setSuccess] = useState(false)

	// Инициализация входных данных из URL с использованием useMemo
	useEffect(() => {
		const searchParams = new URLSearchParams(search)
		const params = Array.from(searchParams.entries()).map(([type, placeholder]) => ({
			type,
			placeholder,
			id: `${type}-${Math.random()}` // Уникальный id для оптимизации рендеринга
		}))
		setInputs(params)

		const initialValues = params.reduce((acc, { type }) => ({ ...acc, [type]: '' }), {})
		setInputValues(initialValues)
	}, [search])

	// Мемоизированная функция обработки изменений
	const handleInputChange = useCallback((type, value) => {
		setInputValues(prev => ({ ...prev, [type]: typeof value === 'object' ? value.value : value }))
	}, [])

	// Оптимизированная валидация
	const validate = useCallback(() => {
		const emptyField = Object.entries(inputValues).find(([value]) => !String(value).trim())
		if (emptyField) {
			setError(`Поле "${emptyField[0]}" не должно быть пустым.`)
			return false
		}
		setError(null)
		return true
	}, [inputValues])

	// Оптимизированная отправка данных
	const handleCreate = useCallback(async () => {
		if (!validate()) return

		setIsSubmitting(true)
		try {
			const jsonData = JSON.stringify(inputValues)
			const tg = window.Telegram?.WebApp

			if (tg) {
				await tg.sendData(jsonData)
				setSuccess(true)
			} else {
				// Fallback для тестирования
				console.log('Telegram WebApp не доступен, данные:', inputValues)
				alert(
					`Данные отправлены:\n${Object.entries(inputValues)
						.map(([k, v]) => `${k}: ${v}`)
						.join('\n')}`
				)
				setSuccess(true)
			}
		} catch (err) {
			console.error('Ошибка при отправке данных:', err)
			setError('Произошла ошибка при отправке данных. Попробуйте еще раз.')
		} finally {
			setIsSubmitting(false)
		}
	}, [inputValues, validate])

	// Мемоизация компонентов формы
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
								placeholder,
								className: 'react-dadata__input'
							}}
						/>
					) : (
						<input
							type="text"
							className="input-field"
							placeholder={placeholder}
							value={inputValues[type] || ''}
							onChange={e => handleInputChange(type, e.target.value)}
						/>
					)}
				</div>
			))}
		</div>
	), [inputs, inputValues, handleInputChange])

	return (
		<div className="create-container">
			{formInputs}
			{error && <div className="error-message">{error}</div>}
			{success && <div className="success-message">Данные успешно отправлены!</div>}
			<button
				className="create-button"
				onClick={handleCreate}
				disabled={isSubmitting}
			>
				{isSubmitting ? 'Отправка...' : 'Создать'}
			</button>
		</div>
	)
}

export default Create