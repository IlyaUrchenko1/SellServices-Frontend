import { useCallback, useEffect, useMemo, useState } from 'react'
import { AddressSuggestions } from 'react-dadata'
import 'react-dadata/dist/react-dadata.css'
import { useLocation } from 'react-router-dom'
import cities from '../../data/List_of_cities'
import './Create.css'


const Create = () => {
	const { search } = useLocation()
	const [inputs, setInputs] = useState([])
	const [inputValues, setInputValues] = useState({
		city: '',
		street: '',
		district: '',
		house: '',
		number_phone: ''
	})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState(null)
	const [success, setSuccess] = useState(false)
	const [showCityList, setShowCityList] = useState(false)
	const [selectedCity, setSelectedCity] = useState('')
	const [streetSuggestion, setStreetSuggestion] = useState(null)
	const [districtSuggestion, setDistrictSuggestion] = useState(null)
	const [validationMessage, setValidationMessage] = useState('')


	const popularCities = useMemo(() => cities, [])

	useEffect(() => {
		try {
			const searchParams = new URLSearchParams(search)
			const params = Array.from(searchParams.entries()).map(([type, value]) => {
				const [placeholder, required] = value.split('|')
				return {
					type,
					placeholder: decodeURIComponent(placeholder),
					required: required === 'True' || ['city', 'street', 'number_phone', 'price'].includes(type),
					id: `${type}-${Math.random()}`
				}
			})
			setInputs(params)

			const initialValues = params.reduce((acc, { type }) => ({ ...acc, [type]: '' }), {})
			setInputValues(prev => ({ ...prev, ...initialValues }))
		} catch (err) {
			console.error('Ошибка при инициализации формы:', err)
			setError('Ошибка при загрузке формы')
		}
	}, [search])

	const validateForm = useCallback(() => {
		const requiredFields = inputs
			.filter(input => input.required)
			.map(input => input.type)

		const emptyFields = requiredFields.filter(field => {
			const value = inputValues[field]
			return !value || value.trim().length === 0
		})

		if (emptyFields.length > 0) {
			const fieldNames = emptyFields.map(field => {
				const input = inputs.find(i => i.type === field)
				return input?.placeholder || field
			})
			setValidationMessage(`Не заполнены обязательные поля: ${fieldNames.join(', ')}`)
			return false
		}

		if (inputValues.price && parseFloat(inputValues.price) <= 0) {
			setValidationMessage('Цена должна быть больше 0')
			return false
		}

		setValidationMessage('')
		return true
	}, [inputs, inputValues])

	const formatPhoneNumber = useCallback((value) => {
		const numbers = value.replace(/\D/g, '')
		if (!numbers) return ''

		if (numbers.length <= 1) return '+7'
		if (numbers.length <= 4) return `+7 (${numbers.slice(1)}`
		if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4)}`
		if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`
		return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`
	}, [])

	const handleInputChange = useCallback((type, value) => {
		try {
			if (type === 'number_phone') {
				const formattedNumber = formatPhoneNumber(value)
				setInputValues(prev => ({ ...prev, [type]: formattedNumber }))
			} else if (type === 'city') {
				const cityValue = value.trim()
				setInputValues(prev => ({
					...prev,
					city: cityValue,
					street: '',
					district: '',
					house: ''
				}))
				setSelectedCity(cityValue)
				setShowCityList(!!cityValue)
				setStreetSuggestion(null)
				setDistrictSuggestion(null)
			} else if (type === 'street') {
				setStreetSuggestion(value)
				const streetValue = value?.data?.street_with_type || ''
				const houseValue = value?.data?.house || ''
				const fullStreet = houseValue ? `${streetValue}, ${houseValue}` : streetValue
				setInputValues(prev => ({
					...prev,
					street: fullStreet,
					house: houseValue
				}))
			} else if (type === 'district') {
				setDistrictSuggestion(value)
				const districtValue = value?.data?.city_district_with_type || value?.data?.area_with_type || ''
				setInputValues(prev => ({ ...prev, district: districtValue }))
			} else {
				const trimmedValue = String(value || '').trim()
				setInputValues(prev => ({ ...prev, [type]: trimmedValue }))
			}
			setError(null)
			setValidationMessage('')
		} catch (err) {
			console.error('Ошибка при изменении поля:', err)
		}
	}, [formatPhoneNumber])

	const handleCreate = useCallback(async () => {
		const isValid = validateForm()
		if (!isValid) {
			setError(validationMessage)
			return // Прерываем выполнение если форма невалидна
		}

		setIsSubmitting(true)
		try {
			const dataToSend = {
				...inputValues,
				street: streetSuggestion?.value || inputValues.street,
				district: districtSuggestion?.value || inputValues.district || 'Не указан'
			}

			const jsonData = JSON.stringify(dataToSend)
			const tg = window.Telegram?.WebApp

			if (tg) {
				await tg.sendData(jsonData)
				setSuccess(true)
				setError(null)
			} else {
				alert(
					`Данные для отправки:\n${Object.entries(dataToSend)
						.map(([k, v]) => `${k}: ${v}`)
						.join('\n')}`
				)
				setSuccess(true)
				setError(null)
			}
		} catch (error) {
			console.error('Ошибка при отправке:', error)
			setError('Произошла ошибка при отправке данных. Попробуйте еще раз.')
		} finally {
			setIsSubmitting(false)
		}
	}, [inputValues, validateForm, validationMessage, streetSuggestion, districtSuggestion])

	const toggleCityList = useCallback(() => {
		setShowCityList(prev => !prev)
	}, [])

	const formInputs = useMemo(() => (
		<div className="inputs-container">
			<div className="input-wrapper city-input-wrapper">
				<input
					type="text"
					className="input-field"
					placeholder="Введите город *"
					value={inputValues.city}
					onChange={e => handleInputChange('city', e.target.value)}
					onFocus={() => setShowCityList(true)}
					autoComplete="off"
				/>
				<button
					type="button"
					className="city-dropdown-button"
					onClick={toggleCityList}
					aria-label={showCityList ? 'Скрыть список городов' : 'Показать список городов'}
				>
					{showCityList ? '▲' : '▼'}
				</button>
				{showCityList && (
					<div className="city-dropdown">
						{popularCities
							.filter(city =>
								popularCities.includes(inputValues.city) ? true :
									city.toLowerCase().includes((inputValues.city || '').toLowerCase())
							)
							.map(city => (
								<div
									key={city}
									className="city-option"
									onClick={() => {
										handleInputChange('city', city)
										setShowCityList(false)
									}}
								>
									{city}
								</div>
							))}
					</div>
				)}
			</div>

			{selectedCity && (
				<div className="input-wrapper">
					<AddressSuggestions
						token="9db66acc64262b755a6cbde8bb766248ccdd3d87"
						value={streetSuggestion}
						onChange={(suggestion) => handleInputChange('street', suggestion)}
						inputProps={{
							placeholder: "Введите улицу *",
							className: 'react-dadata__input',
							autoComplete: "off"
						}}
						filterLocations={[
							{ city: selectedCity }
						]}
						filterFromBound="street"
						filterToBound="house"
						suggestionsLimit={7}
						minChars={1}
						renderOption={(suggestion) => {
							const { street_with_type, house } = suggestion.data
							return house ? `${street_with_type}, ${house}` : street_with_type
						}}
					/>
				</div>
			)}

			{selectedCity && (
				<div className="input-wrapper">
					<AddressSuggestions
						token="9db66acc64262b755a6cbde8bb766248ccdd3d87"
						value={districtSuggestion}
						onChange={(suggestion) => handleInputChange('district', suggestion)}
						inputProps={{
							placeholder: "Введите район (необязательно)",
							className: 'react-dadata__input',
							autoComplete: "off"
						}}
						filterLocations={[
							{ city: selectedCity }
						]}
						filterFromBound="city_district"
						filterToBound="city_district"
						suggestionsLimit={7}
						minChars={1}
						renderOption={(suggestion) => {
							const district = suggestion.data.city_district_with_type || suggestion.data.area_with_type
							return district || 'Район не найден'
						}}
					/>
				</div>
			)}

			{inputs.map(({ type, placeholder, id, required }) => (
				<div key={id} className="input-wrapper">
					{type === 'number_phone' ? (
						<input
							type="tel"
							className="input-field"
							placeholder={`${placeholder}${required ? ' *' : ''}`}
							value={inputValues[type]}
							onChange={e => handleInputChange(type, e.target.value)}
							maxLength={18}
							autoComplete="tel"
						/>
					) : (
						<input
							type={type === 'price' ? 'number' : 'text'}
							className="input-field"
							placeholder={`${placeholder}${required ? ' *' : ''}`}
							value={inputValues[type]}
							onChange={e => handleInputChange(type, e.target.value)}
							autoComplete="off"
							min={type === 'price' ? "1" : undefined}
						/>
					)}
				</div>
			))}
		</div>
	), [inputs, inputValues, handleInputChange, showCityList, selectedCity, toggleCityList, popularCities, streetSuggestion, districtSuggestion])

	return (
		<div className="create-container">
			{formInputs}
			{error && <div className="error-message">{error}</div>}
			{success && <div className="success-message">Данные успешно отправлены!</div>}
			<button
				className="create-button"
				onClick={handleCreate}
				disabled={isSubmitting || !!error}
			>
				{isSubmitting ? 'Отправка...' : 'Создать'}
			</button>
			<div className="form-note">* - обязательные поля</div>
		</div>
	)
}

export default Create