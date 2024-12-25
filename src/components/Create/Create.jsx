import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './Create.css'

const CACHE_KEY = 'citiesCache'
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 часа

const Create = () => {
	const location = useLocation()
	const [inputs, setInputs] = useState([])

	// Логирование доступности Telegram WebApp при инициализации
	useEffect(() => {
		console.log('Checking Telegram WebApp availability...')
		if (window.Telegram && window.Telegram.WebApp) {
			console.log('Telegram WebApp is available')
			console.log('WebApp version:', window.Telegram.WebApp.version)
			console.log('WebApp platform:', window.Telegram.WebApp.platform)
			console.log('WebApp initData:', window.Telegram.WebApp.initData)
			console.log('WebApp colorScheme:', window.Telegram.WebApp.colorScheme)
		} else {
			console.log('Telegram WebApp is not available')
			console.log('Window object:', typeof window)
			console.log('Telegram object:', window.Telegram)
		}
	}, [])

	useEffect(() => {
		const searchParams = new URLSearchParams(location.search)
		const params = Array.from(searchParams.entries())
		const formattedInputs = params.map(([type, placeholder]) => ({
			type,
			placeholder
		}))
		setInputs(formattedInputs)
	}, [location.search])

	const [selectedCity, setSelectedCity] = useState('')
	const [selectedDistrict, setSelectedDistrict] = useState('')
	const [selectedStreet, setSelectedStreet] = useState('')
	const [price, setPrice] = useState('')
	const [showCities, setShowCities] = useState(false)
	const [showDistricts, setShowDistricts] = useState(false)
	const [showStreets, setShowStreets] = useState(false)
	const [suggestedCities, setSuggestedCities] = useState([])
	const [suggestedDistricts, setSuggestedDistricts] = useState([])
	const [suggestedStreets, setSuggestedStreets] = useState([])
	const [allCities, setAllCities] = useState([])
	const [allDistricts, setAllDistricts] = useState([])
	const [allStreets, setAllStreets] = useState([])
	const [errors, setErrors] = useState({
		city: '',
		district: '',
		street: ''
	})

	// Функция для получения данных из кеша
	const getCachedData = useCallback(() => {
		const cached = localStorage.getItem(CACHE_KEY)
		if (cached) {
			const { data, timestamp } = JSON.parse(cached)
			if (Date.now() - timestamp < CACHE_EXPIRY) {
				return data
			}
		}
		return null
	}, [])

	// Функция для сохранения данных в кеш
	const setCacheData = useCallback((data) => {
		const cacheData = {
			data,
			timestamp: Date.now()
		}
		localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
	}, [])

	const fetchCitiesFromOverpassAPI = useCallback(async () => {
		// Проверяем кеш
		const cachedCities = getCachedData()
		if (cachedCities) {
			setAllCities(cachedCities)
			setSuggestedCities(cachedCities)
			return
		}

		const query = `[out:json][timeout:25];area["name"="Россия"]->.searchArea;(node["place"="city"](area.searchArea);node["place"="town"](area.searchArea););out body;`

		try {
			const response = await fetch('https://overpass-api.de/api/interpreter', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: `data=${encodeURIComponent(query)}`,
			})

			if (!response.ok) {
				throw new Error(`Ошибка сети: ${response.status}`)
			}

			const data = await response.json()

			if (!data.elements || !Array.isArray(data.elements)) {
				throw new Error('Неверный формат ответа API')
			}

			const cities = data.elements
				.filter(item => item.tags && item.tags.name)
				.map(item => ({
					name: item.tags.name,
					population: item.tags.population || 0,
					isRegionalCenter: !!item.tags['admin_level']
				}))
				.sort((a, b) => {
					// Сортировка по важности: региональные центры выше, затем по населению
					if (a.isRegionalCenter !== b.isRegionalCenter) {
						return b.isRegionalCenter ? 1 : -1
					}
					return b.population - a.population
				})
				.map(city => city.name)

			setAllCities(cities)
			setSuggestedCities(cities)
			setCacheData(cities)
		} catch (error) {
			console.error('Ошибка при загрузке городов:', error)
			setSuggestedCities([])
		}
	}, [getCachedData, setCacheData])

	const fetchDistrictsFromOverpassAPI = useCallback(async (city) => {
		if (!city) return

		const query = `[out:json];area["name"="${city}"]->.searchArea;(relation["admin_level"="8"](area.searchArea););out body;`

		try {
			const response = await fetch('https://overpass-api.de/api/interpreter', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: `data=${encodeURIComponent(query)}`,
			})

			if (!response.ok) {
				throw new Error(`Ошибка сети: ${response.status}`)
			}

			const data = await response.json()

			if (!data.elements || !Array.isArray(data.elements)) {
				throw new Error('Неверный формат ответа API')
			}

			const districts = data.elements
				.filter(item => item.tags && item.tags.name)
				.map(item => item.tags.name.replace(/район\s*/i, '').trim())

			setAllDistricts(districts)
			setSuggestedDistricts(districts)
		} catch (error) {
			console.error('Ошибка при загрузке районов:', error)
			setSuggestedDistricts([])
		}
	}, [])

	const fetchStreetsFromOverpassAPI = useCallback(async (district) => {
		if (!district) return

		const query = `[out:json];area[name="район ${district}"]->.searchArea;(way["highway"](area.searchArea););out body;>;out skel qt;`

		try {
			const response = await fetch('https://overpass-api.de/api/interpreter', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: `data=${encodeURIComponent(query)}`,
			})

			if (!response.ok) {
				throw new Error(`Ошибка сети: ${response.status}`)
			}

			const data = await response.json()

			if (!data.elements || !Array.isArray(data.elements)) {
				throw new Error('Неверный формат ответа API')
			}

			const streets = data.elements
				.filter(item => item.tags && item.tags.name)
				.map(item => item.tags.name)
				.filter((value, index, self) => self.indexOf(value) === index) // Удаляем дубликаты

			setAllStreets(streets)
			setSuggestedStreets(streets)
		} catch (error) {
			console.error('Ошибка при загрузке улиц:', error)
			setSuggestedStreets([])
		}
	}, [])

	useEffect(() => {
		fetchCitiesFromOverpassAPI()
	}, [fetchCitiesFromOverpassAPI])

	useEffect(() => {
		if (selectedCity) {
			fetchDistrictsFromOverpassAPI(selectedCity)
		}
	}, [selectedCity, fetchDistrictsFromOverpassAPI])

	useEffect(() => {
		if (selectedDistrict) {
			fetchStreetsFromOverpassAPI(selectedDistrict)
		}
	}, [selectedDistrict, fetchStreetsFromOverpassAPI])

	// Улучшенный алгоритм поиска с использованием весов
	const searchCities = useCallback((query) => {
		if (!query || query.length < 2) {
			setSuggestedCities(allCities)
			return
		}

		const normalizedQuery = query.toLowerCase()
		const results = allCities
			.map(city => {
				const normalizedCity = city.toLowerCase()
				let score = 0

				// Точное совпадение начала строки
				if (normalizedCity.startsWith(normalizedQuery)) {
					score += 100
				}

				// Совпадение части слова
				if (normalizedCity.includes(normalizedQuery)) {
					score += 50
				}

				// Расстояние Левенштейна для неточных совпадений
				const distance = levenshteinDistance(normalizedQuery, normalizedCity)
				score -= distance * 2

				return { city, score }
			})
			.filter(item => item.score > 0)
			.sort((a, b) => b.score - a.score)
			.map(item => item.city)

		setSuggestedCities(results)

		// Проверка валидности города
		if (results.length === 0) {
			setErrors(prev => ({ ...prev, city: 'Введите корректное название города' }))
		} else {
			setErrors(prev => ({ ...prev, city: '' }))
		}
	}, [allCities])

	const searchDistricts = useCallback((query) => {
		if (!query || query.length < 2) {
			setSuggestedDistricts(allDistricts)
			return
		}

		const normalizedQuery = query.toLowerCase()
		const results = allDistricts
			.map(district => {
				const normalizedDistrict = district.toLowerCase()
				let score = 0

				if (normalizedDistrict.startsWith(normalizedQuery)) {
					score += 100
				}

				if (normalizedDistrict.includes(normalizedQuery)) {
					score += 50
				}

				const distance = levenshteinDistance(normalizedQuery, normalizedDistrict)
				score -= distance * 2

				return { district, score }
			})
			.filter(item => item.score > 0)
			.sort((a, b) => b.score - a.score)
			.map(item => item.district)

		setSuggestedDistricts(results)

		// Проверка валидности района
		if (results.length === 0) {
			setErrors(prev => ({ ...prev, district: 'Введите корректное название района' }))
		} else {
			setErrors(prev => ({ ...prev, district: '' }))
		}
	}, [allDistricts])

	const searchStreets = useCallback((query) => {
		if (!query || query.length < 2) {
			setSuggestedStreets(allStreets)
			return
		}

		const normalizedQuery = query.toLowerCase()
		const results = allStreets
			.map(street => {
				const normalizedStreet = street.toLowerCase()
				let score = 0

				if (normalizedStreet.startsWith(normalizedQuery)) {
					score += 100
				}

				if (normalizedStreet.includes(normalizedQuery)) {
					score += 50
				}

				const distance = levenshteinDistance(normalizedQuery, normalizedStreet)
				score -= distance * 2

				return { street, score }
			})
			.filter(item => item.score > 0)
			.sort((a, b) => b.score - a.score)
			.map(item => item.street)

		setSuggestedStreets(results)

		// Проверка валидности улицы
		if (results.length === 0) {
			setErrors(prev => ({ ...prev, street: 'Введите корректное название улицы' }))
		} else {
			setErrors(prev => ({ ...prev, street: '' }))
		}
	}, [allStreets])

	// Функция для вычисления расстояния Левенштейна
	const levenshteinDistance = (a, b) => {
		if (a.length === 0) return b.length
		if (b.length === 0) return a.length

		const matrix = []

		for (let i = 0; i <= b.length; i++) {
			matrix[i] = [i]
		}

		for (let j = 0; j <= a.length; j++) {
			matrix[0][j] = j
		}

		for (let i = 1; i <= b.length; i++) {
			for (let j = 1; j <= a.length; j++) {
				if (b.charAt(i - 1) === a.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1]
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1,
						matrix[i][j - 1] + 1,
						matrix[i - 1][j] + 1
					)
				}
			}
		}

		return matrix[b.length][a.length]
	}

	// Оптимизированный debounce для поиска
	useEffect(() => {
		const delayDebounce = setTimeout(() => {
			searchCities(selectedCity)
		}, 300)

		return () => clearTimeout(delayDebounce)
	}, [selectedCity, searchCities])

	useEffect(() => {
		const delayDebounce = setTimeout(() => {
			searchDistricts(selectedDistrict)
		}, 300)

		return () => clearTimeout(delayDebounce)
	}, [selectedDistrict, searchDistricts])

	useEffect(() => {
		const delayDebounce = setTimeout(() => {
			searchStreets(selectedStreet)
		}, 300)

		return () => clearTimeout(delayDebounce)
	}, [selectedStreet, searchStreets])

	// Мемоизация отрендеренного списка городов
	const renderedCitiesList = useMemo(() => {
		return suggestedCities.map((city, i) => (
			<li key={i} onClick={() => {
				setSelectedCity(city)
				setShowCities(false)
				setErrors(prev => ({ ...prev, city: '' }))
			}}>{city}</li>
		))
	}, [suggestedCities])

	const renderedDistrictsList = useMemo(() => {
		return suggestedDistricts.map((district, i) => (
			<li key={i} onClick={() => {
				setSelectedDistrict(district)
				setShowDistricts(false)
				setErrors(prev => ({ ...prev, district: '' }))
			}}>{district}</li>
		))
	}, [suggestedDistricts])

	const renderedStreetsList = useMemo(() => {
		return suggestedStreets.map((street, i) => (
			<li key={i} onClick={() => {
				setSelectedStreet(street)
				setShowStreets(false)
				setErrors(prev => ({ ...prev, street: '' }))
			}}>{street}</li>
		))
	}, [suggestedStreets])

	const handleInputChange = (type, value) => {
		switch (type) {
			case 'city':
				setSelectedCity(value)
				// При изменении города очищаем зависимые поля
				setSelectedDistrict('')
				setSelectedStreet('')
				break
			case 'adress':
				setSelectedDistrict(value)
				// При изменении района очищаем улицу
				setSelectedStreet('')
				break
			case 'street':
				setSelectedStreet(value)
				break
			case 'price':
				setPrice(value)
				break
			default:
				break
		}
	}

	const getInputValue = (type) => {
		switch (type) {
			case 'city':
				return selectedCity
			case 'adress':
				return selectedDistrict
			case 'street':
				return selectedStreet
			case 'price':
				return price
			default:
				return ''
		}
	}

	const isInputDisabled = (type) => {
		switch (type) {
			case 'city':
				return false
			case 'adress':
				return !selectedCity
			case 'street':
				return !selectedCity || !selectedDistrict
			case 'price':
				return false
			default:
				return false
		}
	}

	const handleCreate = () => {
		const data = {
			city: selectedCity,
			adress: selectedDistrict,
			street: selectedStreet,
			price: price
		}

		const jsonData = JSON.stringify(data)

		console.log('Attempting to send data to Telegram WebApp...')
		console.log('Data to be sent:', data)

		if (window.Telegram && window.Telegram.WebApp) {
			console.log('Telegram WebApp methods available:')
			console.log('- MainButton:', !!window.Telegram.WebApp.MainButton)
			console.log('- BackButton:', !!window.Telegram.WebApp.BackButton)
			console.log('- sendData:', !!window.Telegram.WebApp.sendData)
			console.log('- close:', !!window.Telegram.WebApp.close)

			try {
				window.Telegram.WebApp.sendData(jsonData)
				console.log('Data successfully sent to Telegram WebApp')
			} catch (error) {
				console.error('Error sending data to Telegram WebApp:', error)
				console.log('Telegram WebApp state:', {
					isExpanded: window.Telegram.WebApp.isExpanded,
					initDataUnsafe: window.Telegram.WebApp.initDataUnsafe,
					headerColor: window.Telegram.WebApp.headerColor,
					backgroundColor: window.Telegram.WebApp.backgroundColor
				})
			}
		} else {
			console.error('Telegram WebApp not available')
			console.log('Window object properties:', Object.keys(window))
			console.log('Current environment:', {
				userAgent: window.navigator.userAgent,
				href: window.location.href,
				protocol: window.location.protocol,
				host: window.location.host
			})
			alert(`Данные отправлены:\nГород: ${data.city}\nАдрес: ${data.adress}\nУлица: ${data.street}\nЦена: ${data.price} руб.`)
		}
	}

	return (
		<div>
			<div className="inputs-container">
				{inputs.map((input, i) => (
					<div key={i} className="input-wrapper">
						<input
							type="text"
							className={`input-field ${errors[input.type] ? 'error' : ''}`}
							placeholder={input.placeholder}
							value={getInputValue(input.type)}
							onChange={e => handleInputChange(input.type, e.target.value)}
							onFocus={() => {
								if (input.type === 'city') setShowCities(true)
								if (input.type === 'adress') setShowDistricts(true)
								if (input.type === 'street') setShowStreets(true)
							}}
							onBlur={() => {
								if (input.type === 'city') setTimeout(() => setShowCities(false), 200)
								if (input.type === 'adress') setTimeout(() => setShowDistricts(false), 200)
								if (input.type === 'street') setTimeout(() => setShowStreets(false), 200)
							}}
							disabled={isInputDisabled(input.type)}
						/>
						{errors[input.type] && <div className="error-message">{errors[input.type]}</div>}
						{(input.type === 'city' || input.type === 'adress' || input.type === 'street') && !isInputDisabled(input.type) && (
							<div className="city-dropdown">
								<button
									className="dropdown-toggle"
									onClick={(e) => {
										e.preventDefault()
										if (input.type === 'city') setShowCities(!showCities)
										if (input.type === 'adress') setShowDistricts(!showDistricts)
										if (input.type === 'street') setShowStreets(!showStreets)
									}}
								>
									▼
								</button>
								{input.type === 'city' && showCities && suggestedCities.length > 0 && (
									<ul className="cities-list">
										{renderedCitiesList}
									</ul>
								)}
								{input.type === 'adress' && showDistricts && suggestedDistricts.length > 0 && (
									<ul className="cities-list">
										{renderedDistrictsList}
									</ul>
								)}
								{input.type === 'street' && showStreets && suggestedStreets.length > 0 && (
									<ul className="cities-list">
										{renderedStreetsList}
									</ul>
								)}
							</div>
						)}
					</div>
				))}
			</div>

			<button className="create-button" onClick={handleCreate}>Создать</button>
		</div>
	)
}

Create.propTypes = {
	// Убираем propTypes для inputs, так как теперь они получаются из URL
}

export default Create