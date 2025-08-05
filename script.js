// Store configurations
const stores = {
  store1: {
    name: "One Stop",
    users: {
      "Cashier": "Glam2025"
    }
  },
  store2: {
    name: "Golden",
    users: {
      "Cashier2": "Glam2025"
    }
  }
};

let currentStore = null;
let currentUser = null;
let products = [];
let currentSales = [];

function checkLogin() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const error = document.getElementById("login-error");

  // Check if username exists in any store
  let validStore = null;
  
  for (const [storeId, store] of Object.entries(stores)) {
    if (store.users[username] && store.users[username] === password) {
      validStore = storeId;
      break;
    }
  }

  if (validStore) {
    currentStore = validStore;
    currentUser = username;
    document.getElementById("login-container").style.display = "none";
    document.getElementById("store-selection").style.display = "block";
    // Highlight the user's store
    document.querySelector(`button[onclick="selectStore('${currentStore}')"]`)
      .classList.add('active-store');
  } else {
    error.textContent = "Invalid username or password";
  }
}

function selectStore(storeId) {
  if (storeId === currentStore) {
    // User selected their authorized store
    document.getElementById("store-selection").style.display = "none";
    document.getElementById("pos-container").style.display = "block";
    document.getElementById("store-name").textContent = stores[storeId].name;
    loadProducts();
  } else {
    alert("You are not authorized for this store");
  }
}

function loadProducts() {
  fetch('products.json')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load products');
      return response.json();
    })
    .then(data => {
      products = data;
      populateDatalist();
      updateStockDisplay();
    })
    .catch(err => {
      console.error('Error loading products:', err);
      alert('Failed to load product data. Please check your connection.');
    });
}

function populateDatalist() {
  const datalist = document.getElementById('item-list');
  datalist.innerHTML = '';
  products.forEach(p => {
    const option = document.createElement('option');
    option.value = p.name;
    option.setAttribute('data-id', p.id);
    datalist.appendChild(option);
  });
}

function updateStockDisplay() {
  const stockList = document.getElementById('stock-list');
  stockList.innerHTML = '';
  
  products.forEach(product => {
    const stockItem = document.createElement('div');
    stockItem.className = 'stock-item';
    if (product.stock <= 0) {
      stockItem.classList.add('out-of-stock');
    } else if (product.stock < 10) {
      stockItem.classList.add('low-stock');
    }
    
    stockItem.innerHTML = `
      <span class="stock-name">${product.name}</span>
      <span class="stock-quantity">${product.stock} ${product.stock === 1 ? 'pc' : 'pcs'}</span>
    `;
    stockList.appendChild(stockItem);
  });
}

// Event listeners for price calculation
document.getElementById('item').addEventListener('input', updatePrice);
document.getElementById('unit').addEventListener('change', updatePrice);

function updatePrice() {
  const itemName = document.getElementById('item').value.trim();
  const unit = document.getElementById('unit').value;
  const product = products.find(p => p.name.toLowerCase() === itemName.toLowerCase());
  const stockMessage = document.getElementById('stock-message');
  
  if (product) {
    const price = product.prices[unit];
    document.getElementById('price').value = price;
    
    // Update stock message
    if (product.stock <= 0) {
      stockMessage.textContent = "Out of stock!";
      stockMessage.style.color = "red";
    } else {
      stockMessage.textContent = `Available: ${product.stock} ${product.stock === 1 ? 'pc' : 'pcs'}`;
      stockMessage.style.color = product.stock < 10 ? "orange" : "green";
    }
  } else {
    document.getElementById('price').value = '';
    stockMessage.textContent = "";
  }
  calculateTotal();
}

function calculateTotal() {
  const quantity = parseFloat(document.getElementById('quantity').value) || 0;
  const price = parseFloat(document.getElementById('price').value) || 0;
  const discount = parseFloat(document.getElementById('discount').value) || 0;
  const extra = parseFloat(document.getElementById('extra').value) || 0;

  const subtotal = quantity * price;
  const total = subtotal - discount + extra;
  
  document.getElementById('total').value = total.toFixed(2);
  return total;
}

['quantity', 'price', 'discount', 'extra'].forEach(id => {
  document.getElementById(id).addEventListener('input', calculateTotal);
});

document.getElementById('sale-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const item = document.getElementById('item').value;
  if (!item) {
    alert('Please select an item');
    return;
  }

  const product = products.find(p => p.name.toLowerCase() === item.toLowerCase());
  if (!product) {
    alert('Invalid product selected');
    return;
  }

  const quantity = parseFloat(document.getElementById('quantity').value) || 0;
  if (quantity <= 0) {
    alert('Please enter a valid quantity');
    return;
  }

  // Check stock availability
  if (product.stock < quantity) {
    alert(`Not enough stock! Only ${product.stock} available.`);
    return;
  }

  const unit = document.getElementById('unit').value;
  const price = parseFloat(document.getElementById('price').value) || 0;
  const discount = parseFloat(document.getElementById('discount').value) || 0;
  const extra = parseFloat(document.getElementById('extra').value) || 0;
  const paymentMethod = document.getElementById('payment-method').value;
  const total = calculateTotal();

  const sale = {
    item, 
    unit, 
    quantity, 
    price, 
    discount, 
    extra, 
    paymentMethod, 
    total,
    timestamp: new Date().toLocaleTimeString(),
    store: currentStore,
    productId: product.id // Added for stock management
  };
  
  currentSales.push(sale);
  
  // Update local stock (will be confirmed when submitted)
  product.stock -= quantity;
  updateStockDisplay();
  
  updateSalesTable();
  resetForm();
});

function resetForm() {
  document.getElementById('sale-form').reset();
  document.getElementById('price').value = '';
  document.getElementById('total').value = '';
  document.getElementById('stock-message').textContent = '';
  document.getElementById('item').focus();
}

function updateSalesTable() {
  const tbody = document.querySelector('#sales-table tbody');
  tbody.innerHTML = '';
  
  let grandTotal = 0;
  
  currentSales.forEach((sale, index) => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${sale.item}</td>
      <td>${sale.unit}</td>
      <td>${sale.quantity}</td>
      <td>${sale.price.toFixed(2)}</td>
      <td>${sale.discount.toFixed(2)}</td>
      <td>${sale.extra.toFixed(2)}</td>
      <td>${sale.total.toFixed(2)}</td>
      <td>${sale.paymentMethod}</td>
      <td><button onclick="removeSale(${index})">×</button></td>
    `;
    
    tbody.appendChild(row);
    grandTotal += sale.total;
  });
  
  const submitBtn = document.getElementById('submit-all-btn');
  const clearBtn = document.getElementById('clear-all-btn');
  
  if (currentSales.length > 0) {
    submitBtn.style.display = 'inline-block';
    clearBtn.style.display = 'inline-block';
    
    const footerRow = document.createElement('tr');
    footerRow.innerHTML = `
      <td colspan="7" style="text-align: right;"><strong>Grand Total:</strong></td>
      <td><strong>${grandTotal.toFixed(2)}</strong></td>
      <td colspan="2"></td>
    `;
    tbody.appendChild(footerRow);
  } else {
    submitBtn.style.display = 'none';
    clearBtn.style.display = 'none';
  }
}

function removeSale(index) {
  const sale = currentSales[index];
  const product = products.find(p => p.id === sale.productId);
  
  if (product) {
    // Restore stock
    product.stock += sale.quantity;
    updateStockDisplay();
  }
  
  currentSales.splice(index, 1);
  updateSalesTable();
}

function clearAllSales() {
  if (confirm('Are you sure you want to clear all items?')) {
    // Restore all stock from unsold items
    currentSales.forEach(sale => {
      const product = products.find(p => p.id === sale.productId);
      if (product) {
        product.stock += sale.quantity;
      }
    });
    
    currentSales = [];
    updateSalesTable();
    updateStockDisplay();
  }
}

function submitAllSales() {
  if (currentSales.length === 0) {
    alert('No items to submit');
    return;
  }

  const submitBtn = document.getElementById('submit-all-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  const progress = document.createElement('div');
  progress.style.margin = '10px 0';
  progress.style.fontWeight = 'bold';
  progress.innerHTML = `Submitting 0/${currentSales.length} items...`;
  submitBtn.parentNode.appendChild(progress);

  let successCount = 0;
  const errors = [];
  
  const submitNext = (index) => {
    if (index >= currentSales.length) {
      progress.innerHTML = `Completed: ${successCount}/${currentSales.length} items submitted successfully`;
      
      if (errors.length > 0) {
        progress.innerHTML += `<br>${errors.length} items failed`;
        console.error('Failed submissions:', errors);
      }
      
      if (successCount > 0) {
        currentSales.splice(0, successCount);
        updateSalesTable();
      }
      
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit All Items';
      
      setTimeout(() => {
        progress.remove();
      }, 5000);
      
      return;
    }

    progress.innerHTML = `Submitting ${index + 1}/${currentSales.length} items...`;
    
    submitSaleToGoogleForm(currentSales[index])
      .then(() => {
        successCount++;
        submitNext(index + 1);
      })
      .catch(err => {
        errors.push({ index, error: err });
        
        // Restore stock for failed submission
        const sale = currentSales[index];
        const product = products.find(p => p.id === sale.productId);
        if (product) {
          product.stock += sale.quantity;
          updateStockDisplay();
        }
        
        submitNext(index + 1);
      });
  };

  submitNext(0);
}

async function submitSaleToGoogleForm(sale) {
  const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLScGs3PzOn2vABptL5aHssXw2si3Nl_j5tInqr-3X_K_8a2lsw/formResponse";
  
  const formData = new URLSearchParams();
  
  // Add your form fields (using the exact entry IDs from your form)
  formData.append("entry.530043741", sale.item);               // Item
  formData.append("entry.1375268000", sale.unit);              // Unit
  formData.append("entry.782910412", sale.quantity);           // Quantity
  formData.append("entry.1738189165", sale.price);             // Price
  formData.append("entry.1117472858", sale.discount || 0);     // Discount
  formData.append("entry.821166726", sale.extra || 0);         // Extra
  formData.append("entry.392694852", sale.total);              // Total
  formData.append("entry.1649210669", sale.paymentMethod);     // Payment
  formData.append("entry.1206379884", stores[currentStore].name); // Store
  formData.append("entry.1846424292", products.find(p => p.id === sale.productId)?.stock || 0); // Stock

  try {
    console.log("Submitting sale:", sale);
    console.log("Form data:", formData.toString());

    const response = await fetch(formUrl, {
      method: "POST",
      mode: "no-cors", // Important for Google Forms
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    });

    // Note: With no-cors mode, we can't read the response
    console.log("Submission attempted");
    return Promise.resolve(); // Consider all submissions as successful
    
  } catch (error) {
    console.error("Submission error:", error);
    return Promise.reject(error);
  }
}
