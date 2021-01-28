//Executing the jQuery code only AFTER library file has loaded
$(function(){
  //Key for openweathermap API
  const APIkey = 'a995214b683257e6473709c1e1510cbe'

  //Array to store all countries from API data
  let allCountries = []

  //Fetches API country objects using jQuery ajax function and insert those to allCountries array
  const setCountries = () => {
    $.ajax({
      url: 'https://restcountries.eu/rest/v2/all',
      dataType: 'json',
      success: data => allCountries = data,
      error: error => console.log('Something went wrong in setCountries function: Error: ', error)
    })
  }

  //Function that is used to add commas after every 3 numbers
  const addCommas = num => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  //Function to capitalize first letter of sentence
  const capitalize = string => string.replace(/^./, string[0].toUpperCase())

  //Function to fetch Covid API data of the whole world and show it in a table
  const showWorldSummary = () => {
      //Fetching data from API and saving it in a variable
    $.ajax({
      url: 'https://api.covid19api.com/summary',
      dataType: 'json',
      success: data => {
        const cases = data.Global
        const td = $('#worldStatsTable tbody tr td')

        //Inserting the parsed data into worldStatsTable
        td[0].innerText = addCommas(cases.TotalConfirmed)
        td[1].innerText = addCommas(cases.TotalDeaths)
        td[2].innerText = addCommas(cases.TotalRecovered)
        td[3].innerText = `(+${addCommas(cases.NewConfirmed)})`
        td[4].innerText = `(+${addCommas(cases.NewDeaths)})`
        td[5].innerText = `(+${addCommas(cases.NewRecovered)})`
      },
      error: error => {
        console.log('Something went wrong in showWorldSummary function: Error: ', error)
      }
    })
  }

  //Function to search for countries from allCountries array. Also shows criteria for searching
  const searchCountry = () => {
    const searchResults = $('#searchResults')

    //User inputs search value and filter will check if corresponding country can be found on an array
    let countryList = allCountries.filter(country => {
      return country.name.toLowerCase().includes($('#searchCountry').val().toLowerCase())
    })

    //Checks how many search results have been found and gives the feedback to the user. User will see less than 10 results.
    if (countryList.length > 10) {
      searchResults.text('More than 10 results was found. Please specify your search result.')
    } else if (countryList.length === 1) {
      //Storing the only filtered country into a variable
      let country = countryList[0]

      //If only one country is found with criteria, many elements will be unhidden by slideDown and shown to the user
      $('#content').slideDown(500)
    
      //Searching data from APIs and showing it to the user
      updateSearches(country.name)
      showCountry(country)
      showWeather(country.capital)
      searchCovidStats(country.name)
    } else if (countryList.length === 0) {
      //If no countries were found, tell user
      searchResults.text('No search results found.')
    } else {
      //If less than 10 but more than 1 search result -> Show it to the user
      searchResults.html('<p><b>Search results</b></p>')
      for (let country of countryList) {
        //Create a new 'li' element with country name on it
        const li = $(`<li>${country.name}</li>`)

        //Adding dynamically click event handler. On click find details of that specific country
        li.click(() => {
         $('#searchCountry').val(country.name)
          searchCountry()
        })
        //Let's user know the 'li' element is clickable
        li.on('mouseenter', () => {
          li.fadeTo(500, 0.7)
          li.css({'color': '#48bfe3'})
        })
        //Let's user know the 'li' element is clickable
        li.on('mouseleave', () => {
          li.fadeTo(500, 1.0)
          li.css({'color': 'black'})
        })
        //Append the 'li' element into search results
        searchResults.append(li)
      }
    }
  }

  //Function to fetch data from openweathermap API and showcasing it as a table to the user
  const showWeather = capital => {
    $.ajax({
      url: `https://api.openweathermap.org/data/2.5/weather?q=${capital}&appid=${APIkey}&units=metric`,
      dataType: 'json',
      success: data => {
         //Inserts the data into an already existing table
          const td = $('#weatherStatsTable > tbody > tr > td')
          td[1].innerText = `${data.main.temp} °C`
          td[3].innerText = `${data.main.humidity} %`
          td[5].innerText = `${data.wind.speed} m/s`
          td[7].innerText = `${capitalize(data.weather[0].description)}`
          //Inserts a new source attribute to weather icon image
          $('#weatherIcon').attr('src', `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`)
      },
      error: error => console.log('Something went wrong in showWeather function: Error: ', error)
    })
  }

  //Function to show fetched country data to the usre
  const showCountry = country => {
    //Resets the search bar and results
    $('#searchCountry').val('')
    $('#searchResults').html('')

    //The languages are as an array objects - this function will get the names of languages and put them into array
    const languages = country.languages.map(lang => ` ${lang.name}`)

    //Inserts the data into an already existing table
    $('#countryTitle').html(`<h3>${country.name} (${country.nativeName})</h3>`)
    const td = $('#countryStatsTable > tbody > tr > td')
    td[1].innerText = `${country.capital}`
    td[3].innerText = `${languages}`
    td[5].innerText = `${addCommas(country.population)}`
  }

  //Function to keep a track of maximum of 5 search results into browser's local storage
  const updateSearches = search => {
    //Only update the search results storagelist if search result is a new one
    if (!JSON.parse(localStorage['pastSearches']).includes(search)) {
    const maxSearchs = 4
    const searchHistory = JSON.parse(localStorage['pastSearches'])
    const isSearchMax = searchHistory.length > maxSearchs
    const updateSearchHistory = isSearchMax ? searchHistory.slice(1) : searchHistory 
    const newSearchHistory = updateSearchHistory.concat(search)
    localStorage['pastSearches'] = JSON.stringify(newSearchHistory)

    //After updating the search results show the updated list to the user
    showSearches()
    }
  }

  //Function to show 5 recent search results to the user
  const showSearches = () => {
    //If localstorage is empty or reset - this will keep an empty array as a placeholder
    if (localStorage['pastSearches'] === undefined) {
      localStorage['pastSearches'] = JSON.stringify([''])
    }

    //Resets the search history element that is shown to the user
    const searchHistory = $('#searchHistory')
    searchHistory.html('')

    //After resetting the search history - show the new search history to the user
    const searchs = JSON.parse(localStorage['pastSearches'])
    searchHistory.html('<p><b>Last searched</b></p>')
    searchs.map(search => {
      //Create new 'li' element
      const li = $(`<li>${search}</li>`)
      //Add click event to search for this specific country
      li.click(() => {
        $('#searchCountry').val(search)
        searchCountry()
      })
      //Depending on mouse movement - highlight the word to user to notify its clickable
      li.on('mouseenter', () => {
        li.fadeTo(500, 0.7)
        li.css({'color': '#48bfe3'})
      })
      li.on('mouseleave', () => {
        li.fadeTo(500, 1.0)
        li.css({'color': 'black'})
      })
      //Insert created 'li' element into search history list
      searchHistory.append(li)
    })
  }

  //Function to fetch covid statistics from an API
  const searchCovidStats = country => {  
    $.ajax({
      url: `https://api.covid19api.com/country/${country}`,
      dataType: 'json',
      success: data => showCovidStats(data),
      error: error => console.log('Something went wrong in searchCovidStats function: Error: ', error)
    })
  }
  
  //Function to show fetched covid statistics to the user
  const showCovidStats = data => {
    //Shows the selected country's covid statistics (confirmed, deaths, recovered, update date)
    const span = $('#covidStats > p > span')
    const day = data.length - 1
    span[0].innerText = addCommas(data[day].Confirmed)
    span[1].innerText = addCommas(data[day].Deaths)
    span[2].innerText = addCommas(data[day].Recovered)
    span[3].innerText = data[day].Date.slice(0, -10)

    //Function to create rows into an table that are filled with covid data based on calculations
    const createRow = (data, id1, id2) => {
      //Adds an event handler to checkbuttons that toggles hide/show on confirmed, deaths, and recovered cases
      $(`#hide${id1}`).click(() => $(`#${id2}Tr`).toggle())
      //API data only had total amounts of cases - new cases were not specified. This for loop is to calculate new cases per day
      //currentDay and cellIndex are to help calculations display backwards - so that they are in order
      currentDay = 0
      cellIndex = 13
      for (let i = data.length - 1; i > (data.length - 15); i--) {
        currentDay = i
        lastDay = i - 1
        const td = $(`#${id2}Tr td`)
        td[cellIndex].innerText = addCommas(data[currentDay][id1] - data[lastDay][id1])
        cellIndex--
      }
    }

    //Creating rows for confirmed, deaths, and recovered cases to display to the user
    createRow(data, 'Confirmed', 'confirmed')
    createRow(data, 'Deaths', 'deaths')
    createRow(data, 'Recovered', 'recovered')
  }  

  //Execute searchCountry function everytime input has been changed
  $('#searchCountry').on('input', () => searchCountry())

  //On page refresh - execute these functions
  //Sets country array - so only need to fetch once all countries from API
  setCountries()
  //Show search history to user (maximum of 5), if any
  showSearches()
  //Shows the world's corona situation
  showWorldSummary()

  //Hide elements before searching for first time
  $('#content').slideToggle(0)
})
