import { useCallback, useEffect, useMemo, useState } from 'react'
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
		if (!address) return false
		const parts = address.split(',').map(part => part.trim())
		return parts.length === 3 && parts.every(part => part.length > 0)
	}

	const validateDistrict = (district) => {
		if (!district) return false
		const parts = district.split(',').map(part => part.trim())
		return parts.length === 2 && parts.every(part => part.length > 0)
	}

	const validate = useCallback(() => {
		// Проверка на пустые поля
		const emptyField = Object.entries(inputValues).find(([key, value]) => {
			if (key === 'number_phone') {
				return !value || value.length < 18
			}
			if (key === 'district') {
				return showDistrict && !String(value).trim()
			}
			return !String(value).trim()
		})

		if (emptyField) {
			setError(`Поле "${emptyField[0]}" не должно быть пустым.`)
			return false
		}

		// Проверка формата адреса
		if (!validateAddress(inputValues.adress)) {
			setError('Адрес должен содержать три значения через запятую (Город, улица, дом)')
			return false
		}

		// Проверка формата района если он показан
		if (showDistrict && !validateDistrict(inputValues.district)) {
			setError('Район должен содержать два значения через запятую (Город, район)')
			return false
		}

		setError(null)
		return true
	}, [inputValues, showDistrict])

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
							placeholder={placeholder}
							value={inputValues[type] || ''}
							onChange={e => handleInputChange(type, e.target.value)}
							maxLength={18}
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
	), [inputs, inputValues, handleInputChange, showDistrict])

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