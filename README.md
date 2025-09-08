# Todo2

A simple and efficient todo application for managing your daily tasks and projects.

## Overview

Todo2 is designed to help you organize, track, and complete your tasks efficiently. Whether you're managing personal projects or coordinating team activities, Todo2 provides the tools you need to stay productive.

## Features

- ✅ Create, edit, and delete tasks
- 📅 Set due dates and priorities
- 🏷️ Organize tasks with categories and tags
- ✔️ Mark tasks as complete
- 🔍 Search and filter tasks
- 📊 Track progress and productivity

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kellyarwine/todo2.git
   cd todo2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Creating Tasks

1. Click the "Add Task" button or use the quick input field
2. Enter your task description
3. Optionally set a due date, priority level, and category
4. Click "Save" to add the task to your list

### Managing Tasks

- **Complete a task**: Click the checkbox next to the task
- **Edit a task**: Click on the task text to enter edit mode
- **Delete a task**: Click the delete icon (trash can) next to the task
- **Filter tasks**: Use the filter options to view specific categories or completion status

### Organizing Tasks

- **Categories**: Group related tasks together using categories
- **Priorities**: Set High, Medium, or Low priority levels
- **Due dates**: Set deadlines to keep track of time-sensitive tasks

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

## Project Structure

```
todo2/
├── src/
│   ├── components/     # React components
│   ├── services/       # API and data services
│   ├── utils/          # Utility functions
│   └── styles/         # CSS and styling files
├── public/             # Static assets
├── tests/              # Test files
└── docs/               # Documentation
```

## Contributing

We welcome contributions to Todo2! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Style

- Use ESLint and Prettier for code formatting
- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features

## API Documentation

### Task Object

```javascript
{
  id: string,
  title: string,
  description: string,
  completed: boolean,
  priority: 'high' | 'medium' | 'low',
  category: string,
  dueDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Available Endpoints

- `GET /api/tasks` - Retrieve all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update an existing task
- `DELETE /api/tasks/:id` - Delete a task
- `GET /api/tasks/search` - Search tasks by query

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
API_KEY=your_api_key
```

## Deployment

### Docker

```bash
docker build -t todo2 .
docker run -p 3000:3000 todo2
```

### Heroku

```bash
heroku create your-app-name
git push heroku main
```

## Troubleshooting

### Common Issues

**Issue**: Application won't start
- **Solution**: Ensure all dependencies are installed (`npm install`) and environment variables are set

**Issue**: Database connection errors
- **Solution**: Check your DATABASE_URL in the `.env` file

**Issue**: Tasks not saving
- **Solution**: Verify API endpoints are working and check browser console for errors

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Real-time collaboration
- [ ] Integration with calendar applications
- [ ] Dark mode theme
- [ ] Offline functionality
- [ ] Task templates
- [ ] Time tracking
- [ ] Reporting and analytics

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/kellyarwine/todo2/issues) page
2. Search existing issues before creating a new one
3. Provide detailed information when reporting bugs
4. Include steps to reproduce the issue

## Acknowledgments

- Thanks to all contributors who have helped improve Todo2
- Inspired by the need for simple, effective task management
- Built with modern web technologies and best practices

## Changelog

### Version 1.0.0
- Initial release
- Basic task management functionality
- Categories and priorities
- Search and filter capabilities

---

**Happy organizing! 📝✨**