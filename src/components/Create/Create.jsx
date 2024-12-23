import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import './Create.css'

const popularCities = [
	"Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург",
	"Казань", "Нижний Новгород", "Челябинск", "Самара",
	"Омск", "Ростов-на-Дону"
]

const Create = ({ inputs }) => {
	const [selectedCity, setSelectedCity] = useState('')
	const [showCities, setShowCities] = useState(false)
	const [suggestedCities, setSuggestedCities] = useState([])

	const handleCityInput = (city) => {
		setSelectedCity(city)
		setShowCities(false)
		setSuggestedCities([])
	}

	useEffect(() => {
		if (selectedCity.length > 0) {
			const suggestions = popularCities.filter(city =>
				city.toLowerCase().includes(selectedCity.toLowerCase())
			)
			setSuggestedCities(suggestions)
		} else {
			setSuggestedCities([])
		}
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
								{(showCities || suggestedCities.length > 0) && (
									<ul className="cities-list">
										{(selectedCity.length > 0 ? suggestedCities : popularCities).map((city, i) => (
											<li key={i} onClick={() => handleCityInput(city)}>{city}</li>
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