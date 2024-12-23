import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import './Create.css'

const Create = ({ inputs }) => {
	const [selectedCity, setSelectedCity] = useState('')
	const [showCities, setShowCities] = useState(false)
	const [suggestedCities, setSuggestedCities] = useState([])

	const fetchCitiesFromOverpassAPI = async () => {
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
				throw new Error(`Network response was not ok: ${response.status}`)
			}

			const data = await response.json()
			console.log('Raw API response:', data) // Логируем весь ответ API

			if (!data.elements || !Array.isArray(data.elements)) {
				console.error('Invalid API response format:', data)
				return
			}

			// Получаем только русские названия городов из тега name
			const cities = data.elements
				.filter(item => item.tags && item.tags.name) // Проверяем наличие tags и name
				.map(item => item.tags.name)
				.filter((city, index, self) => self.indexOf(city) === index) // Убираем дубликаты
				.sort() // Сортируем по алфавиту

			console.log('Processed cities:', cities)

			if (cities.length === 0) {
				console.warn('No cities found in the response')
			}

			setSuggestedCities(cities)
		} catch (error) {
			console.error('Error fetching cities:', error)
			setSuggestedCities([])
		}
	}

	useEffect(() => {
		console.log('Component mounted, fetching cities...')
		fetchCitiesFromOverpassAPI()
	}, [])

	const searchCities = (query) => {
		if (query.length < 2) {
			return
		}

		const filteredCities = suggestedCities.filter(city => 
			city.toLowerCase().includes(query.toLowerCase())
		)
		console.log('Filtered cities:', filteredCities)
		setSuggestedCities(filteredCities)
	}

	useEffect(() => {
		const delayDebounce = setTimeout(() => {
			if (selectedCity) {
				searchCities(selectedCity)
			}
		}, 300)

		return () => clearTimeout(delayDebounce)
	}, [selectedCity])

	return (
		<div>
			<div className="inputs-container">
				{inputs.map((input, i) => (
					<div key={i} className="input-wrapper">
						<input
							type="text"
							className="input-field"
							placeholder={input.placeholder}
							value={input.type === 'city' ? selectedCity : ''}
							onChange={e => input.type === 'city' && setSelectedCity(e.target.value)}
							onFocus={() => input.type === 'city' && setShowCities(true)}
						/>
						{input.type === 'city' && (
							<div className="city-dropdown">
								<button className="dropdown-toggle" onClick={() => setShowCities(!showCities)}>▼</button>
								{showCities && suggestedCities.length > 0 && (
									<ul className="cities-list">
										{suggestedCities.map((city, i) => (
											<li key={i} onClick={() => {
												setSelectedCity(city)
												setShowCities(false)
											}}>{city}</li>
										))}
									</ul>
								)}
							</div>
						)}
					</div>
				))}
			</div>

			<button className="create-button">Создать</button>
		</div>
	)
}

Create.propTypes = {
	inputs: PropTypes.arrayOf(
		PropTypes.shape({
			type: PropTypes.string.isRequired,
			placeholder: PropTypes.string.isRequired,
		})
	).isRequired,
}

export default Create