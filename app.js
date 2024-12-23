const model = {
    todos: [],
    filter: 'all',

    async loadTodos() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://tickit-qw0u.onrender.com/api/todos', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`, // Include JWT token
                },
            });

            if (response.ok) {
                this.todos = await response.json();
            } else {
                console.error('Failed to load todos');
                this.todos = [];
            }
        } catch (error) {
            console.error('Failed to load todos', error);
            this.todos = [];
        }
        render();
    },

    async saveTodos() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://tickit-qw0u.onrender.com/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, // Include JWT token
                },
                body: JSON.stringify({ todos: this.todos }),
            });
            if (!response.ok) {
                console.error('Failed to save todos');
            }
        } catch (error) {
            console.error('Failed to save todos', error);
        }
    },
};

// Function to render the login form
function renderLoginForm() {
    document.querySelector('.todoapp').classList.add('hidden'); // Hide the Todo App
    document.querySelector('.auth-section').classList.remove('hidden'); // Show Authentication Section
    document.querySelector('.join-now-btn').classList.add('hidden');

    const authForms = document.getElementById('auth-forms');
    authForms.innerHTML = `
        <h1>Login</h1>
        <form id="loginForm">
            <p id="error-message" class="error hidden"></p>
            <input type="text" id="username" placeholder="Username" required>
            <input type="password" id="password" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>
        <p>Don't have an account? <button class="switch-to-signup" onclick="renderSignUpForm()">Sign Up</button></p>
    `;

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('username').focus();
}

// Function to handle login
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        showError('Please enter both username and password.');
        return;
    }

    try {
        const response = await fetch('https://tickit-qw0u.onrender.com/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token); // Store JWT token
            alert('Login successful!');
            document.querySelector('.auth-section').classList.add('hidden');
            document.querySelector('.todoapp').classList.remove('hidden');
            document.querySelector('.logout-btn').classList.remove('hidden');
            await model.loadTodos(); // Load todos after login
        } else {
            const errorData = await response.json();
            showError(errorData.message || 'Login failed.');
        }
    } catch (error) {
        console.error('Error during login:', error);
        showError('An unexpected error occurred. Please try again later.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash || '#/';
    switch (hash) {
        case '#/':
            model.filter = 'all';
            break;
        case '#/active':
            model.filter = 'active';
            break;
        case '#/completed':
            model.filter = 'completed';
            break;
        default:
            model.filter = 'all';
    }
    render();
});

window.addEventListener('hashchange', () => {
    const hash = window.location.hash || '#/';
    switch (hash) {
        case '#/':
            model.filter = 'all';
            break;
        case '#/active':
            model.filter = 'active';
            break;
        case '#/completed':
            model.filter = 'completed';
            break;
        default:
            model.filter = 'all';
    }
    render();
});


// Handle Logout
function handleLogout() {
    localStorage.removeItem('token'); // Remove the JWT token
    const todoAppSection = document.querySelector('.todoapp');
    const joinNowButton = document.querySelector('.join-now-btn');
    const logoutButton = document.querySelector('.logout-btn');
    const authSection = document.querySelector('.auth-section');

    model.todos = [];
    render();

    todoAppSection.classList.remove('hidden'); // Hide todo app
    joinNowButton.classList.remove('hidden'); // Show "Join Us" button
    authSection.classList.add('hidden'); // Hide authentication form
    logoutButton.classList.add('hidden'); // Hide logout button
}

// Function to render sign-up form
function renderSignUpForm() {
    const authForms = document.getElementById('auth-forms');
    document.querySelector('.join-now-btn').classList.add('hidden');
    authForms.innerHTML = `
        <h1>Sign Up</h1>
        <form id="signupForm">
            <p id="error-message" class="error hidden"></p>
            <input type="text" id="signupUsername" placeholder="Username" required>
            <input type="password" id="signupPassword" placeholder="Password" required>
            <button type="submit">Sign Up</button>
        </form>
        <p>Already have an account? <button class="switch-to-login" onclick="renderLoginForm()">Login</button></p>
    `;

    document.getElementById('signupForm').addEventListener('submit', handleSignUp);
    document.getElementById('signupUsername').focus();
}

async function handleSignUp(event) {
    event.preventDefault();

    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value.trim();

    if (!username || !password) {
        showError('Please fill out both fields.');
        return;
    }

    try {
        const response = await fetch('https://tickit-qw0u.onrender.com/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            alert('Signup successful! You can now log in.');
            renderLoginForm();
        } else {
            const errorData = await response.json();
            showError(errorData.message || 'Signup failed.');
        }
    } catch (error) {
        console.error('Error during signup:', error);
        showError('An unexpected error occurred. Please try again later.');
    }
}

// Function to show error messages
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token'); // Check if the user is logged in

    const todoAppSection = document.querySelector('.todoapp');
    const joinNowButton = document.querySelector('.join-now-btn');
    const logoutButton = document.querySelector('.logout-btn');
    const authSection = document.querySelector('.auth-section');

    if (token) {
        try {
            // Attempt to load todos if the token exists
            await model.loadTodos();
            todoAppSection.classList.remove('hidden'); // Show todo app
            joinNowButton.classList.add('hidden'); // Hide "Join Us" button
            authSection.classList.add('hidden'); // Hide authentication form
            logoutButton.classList.remove('hidden'); // Show logout button
        } catch (error) {
            console.error('Failed to load todos or invalid token:', error);
            handleLogout(); // If token is invalid, log the user out
        }
    } else {
        // If not logged in, only show "Join Us" button and todo app (restricted)
        todoAppSection.classList.remove('hidden'); // Hide todo app for restricted users
        joinNowButton.classList.remove('hidden'); // Show "Join Us" button
        authSection.classList.add('hidden'); // Hide authentication form
        logoutButton.classList.add('hidden'); // Hide logout button
    }
});

async function addTodo(title) {
    if (!title) return;
    const newTodo = { id: Date.now(), title, completed: false };
    model.todos.push(newTodo);
    await model.saveTodos();
    render();
}

async function toggleTodo(id) {
    const todo = model.todos.find((todo) => todo.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        await model.saveTodos();
        render();
    }
}

async function removeCompleted() {
    model.todos = model.todos.filter((todo) => !todo.completed);
    await model.saveTodos();
    render();
}


function render() {
    const todoList = document.querySelector('.todo-list');
    todoList.innerHTML = '';

    model.todos
        .filter((todo) => {
            if (model.filter === 'active') return !todo.completed;
            if (model.filter === 'completed') return todo.completed;
            return true;
        })
        .forEach((todo) => {
            const li = document.createElement('li');
            li.className = todo.completed ? 'completed' : '';
            li.innerHTML = `
                <div class="view">
                    <input class="toggle" type="checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
                    <label>${todo.title}</label>
                </div>
                <button class="destroy" data-id="${todo.id}"><i class="fa-solid fa-xmark"></i></button>
            `;
            todoList.appendChild(li);
        });

    document.querySelector('.main').style.display =
        model.todos.length > 0 ? 'block' : 'none';
    document.querySelector('.footer').style.display =
        model.todos.length > 0 ? 'block' : 'none';
    document.querySelector('.todo-count').textContent = `${
        model.todos.filter((todo) => !todo.completed).length
    } items left`;
}

document.querySelector('.filters').addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
        document.querySelectorAll('.filters a').forEach((filter) => {
            filter.classList.remove('selected');
        });

        e.target.classList.add('selected');
        model.filter = e.target.textContent.toLowerCase();
        render();
    }
});

document.querySelector('.new-todo').addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
        addTodo(e.target.value.trim());
        e.target.value = '';
    }
});

document.querySelector('.todo-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('toggle')) {
        toggleTodo(Number(e.target.dataset.id));
    }
    if (e.target.classList.contains('destroy')) {
        const id = Number(e.target.dataset.id);
        model.todos = model.todos.filter((todo) => todo.id !== id);
        model.saveTodos();
        render();
    }
});

document.querySelector('.clear-completed').addEventListener('click', removeCompleted);

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        model.todos.forEach((todo) => {
            todo.completed = true;
        });
        model.saveTodos();
        render();
    }
});
