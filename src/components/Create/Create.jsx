import { useCallback, useEffect, useMemo, useState } from 'react'
import { AddressSuggestions } from 'react-dadata'
import 'react-dadata/dist/react-dadata.css'
import { useLocation } from 'react-router-dom'
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
	const [isFormValid, setIsFormValid] = useState(false)

	const popularCities = useMemo(() => [
		'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань',
		'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону',
		'Уфа', 'Красноярск', 'Воронеж', 'Пермь', 'Волгоград',
		'Краснодар', 'Саратов', 'Тюмень', 'Тольятти', 'Ижевск',
		'Барнаул', 'Иркутск', 'Ульяновск', 'Хабаровск', 'Ярославль',
		'Владивосток', 'Махачкала', 'Томск', 'Оренбург', 'Кемерово',
		'Новокузнецк', 'Рязань', 'Астрахань', 'Пенза', 'Липецк'
	], [])

	useEffect(() => {
		try {
			const searchParams = new URLSearchParams(search)
			const params = Array.from(searchParams.entries()).map(([type, placeholder]) => ({
				type,
				placeholder,
				id: `${type}-${Math.random()}`
			}))
			setInputs(params)

			const initialValues = params.reduce((acc, { type }) => ({ ...acc, [type]: '' }), {})
			setInputValues(prev => ({ ...prev, ...initialValues }))
		} catch (err) {
			console.error('Ошибка при инициализации формы:', err)
			setError('Ошибка при загрузке формы')
		}
	}, [search])

	useEffect(() => {
		const validateForm = () => {
			const requiredFields = [
				'city',
				'street',
				'number_phone',
				'price',
				'rooms'
			]

			const isValid = requiredFields.every(field => {
				const value = inputValues[field]
				const fieldValid = value && value.trim().length > 0
				return field === 'district' || fieldValid
			})

			setIsFormValid(isValid)
		}

		validateForm()
	}, [inputValues])

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
		} catch (err) {
			console.error('Ошибка при изменении поля:', err)
		}
	}, [formatPhoneNumber])

	const handleCreate = useCallback(async () => {
		if (!isFormValid) {
			setError('Пожалуйста, заполните все обязательные поля')
			return
		}

		setIsSubmitting(true)
		try {
			const dataToSend = {
				...inputValues,
				district: inputValues.district || 'Не указан'
			}

			const jsonData = JSON.stringify(dataToSend)
			const tg = window.Telegram?.WebApp

			if (tg) {
				await tg.sendData(jsonData)
				setSuccess(true)
			} else {
				console.warn('⚠️ Telegram WebApp не доступен, данные будут показаны в alert')
				alert(
					`Данные для отправки:\n${Object.entries(dataToSend)
						.map(([k, v]) => `${k}: ${v}`)
						.join('\n')}`
				)
				setSuccess(true)
			}
		} catch (err) {
			console.error('❌ Ошибка при отправке данных:', err)
			setError('Произошла ошибка при отправке данных. Попробуйте еще раз.')
		} finally {
			setIsSubmitting(false)
		}
	}, [inputValues, isFormValid])

	const toggleCityList = useCallback(() => {
		setShowCityList(prev => !prev)
	}, [])

	const formInputs = useMemo(() => (
		<div className="inputs-container">
			<div className="input-wrapper city-input-wrapper">
				<input
					type="text"
					className="input-field"
					placeholder="Введите город"
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
							placeholder: "Введите улицу",
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

			{inputs.map(({ type, placeholder, id }) => (
				<div key={id} className="input-wrapper">
					{type === 'number_phone' ? (
						<input
							type="tel"
							className="input-field"
							placeholder={placeholder}
							value={inputValues[type]}
							onChange={e => handleInputChange(type, e.target.value)}
							maxLength={18}
							autoComplete="tel"
						/>
					) : (
						<input
							type="text"
							className="input-field"
							placeholder={placeholder}
							value={inputValues[type]}
							onChange={e => handleInputChange(type, e.target.value)}
							autoComplete="off"
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
				disabled={isSubmitting || !isFormValid}
			>
				{isSubmitting ? 'Отправка...' : 'Создать'}
			</button>
		</div>
	)
}

export default Create