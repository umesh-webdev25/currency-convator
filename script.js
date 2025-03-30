const BASE_URL = "https://api.frankfurter.app/latest";

const dropdowns = document.querySelectorAll(".dropdown select")
const btn = document.querySelector("form button");
const fromCurr = document.querySelector(".from select");
const toCurr = document.querySelector(".to select");
const msg = document.querySelector(".msg");
for(let select of dropdowns)
{
    for (currCode in countryList)
        {
           let newOption = document.createElement("option");
           newOption.innerText = currCode;
           newOption.value = currCode;
           if(select.name === "from" && currCode === "USD")
           {
            newOption.selected = "selected";
           } 
           else if(select.name === "to" && currCode === "INR")
            {
             newOption.selected = "selected";

           }
           select.append(newOption);
        }
        select.addEventListener("change",(evt) => {
            updateFlag(evt.target);
        })
}

const updateFlag = (element) => {
   let currCode = element.value;
   console.log(currCode);
   let cuntryCode = countryList[currCode];
   let newSrc = `https://flagsapi.com/${cuntryCode}/flat/64.png`;
   let img = element.parentElement.querySelector("img");
   img.src = newSrc;
}

btn.addEventListener("click", async (evt) =>{
       evt.preventDefault();
       let amount = document.querySelector(".amount input");
       let amtVal = amount.value;
       if(amtVal === "" || amtVal < 1 )
       {
        amtVal = 1;
        amount.value = "1";
       }
    //    console.log(amtVal);

    const URL = `${BASE_URL}?from=${fromCurr.value.toLowerCase()}&to=${toCurr.value.toLowerCase()}`;

    try {
        let response = await fetch(URL);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
        let data = await response.json();
        console.log("API Response:", data);
    
        let rate = data.rates[toCurr.value];
        if (!rate) {
            console.error("Exchange rate not found:", data);
            msg.innerText = "Error: Exchange rate not available.";
            return;
        }
    
        let finalAmount = amtVal * rate;
        msg.innerText = `${amtVal} ${fromCurr.value} = ${finalAmount.toFixed(2)} ${toCurr.value}`;
    } catch (error) {
        console.error("Error fetching data:", error);
        msg.innerText = "Failed to fetch exchange rate.";
    }
    });