# Todo2

A modern todo application with advanced threading and mention capabilities.

## Overview

Todo2 is designed to handle complex task management scenarios where tasks can be organized in threads and team members can be mentioned for collaboration. This application is particularly useful for scenarios where tasks generate multiple discussions and require team coordination.

## Features

### Core Functionality
- ✅ Create, edit, and delete todo items
- 📝 Rich text support for task descriptions
- 🏷️ Tag and categorize tasks
- ⏰ Set due dates and reminders

### Threading & Collaboration
- 🧵 **Thread Support**: Organize related tasks and discussions in threaded conversations
- 👥 **Mentions**: Mention team members using @username to notify and involve them in specific tasks
- 💬 **Comments**: Add comments to tasks for detailed discussions
- 🔔 **Notifications**: Get notified when mentioned in tasks or threads

### Advanced Features
- 🔍 Search and filter tasks
- 📊 Progress tracking and analytics
- 🎯 Priority levels and task organization
- 📱 Cross-platform synchronization

## Installation

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Setup
```bash
# Clone the repository
git clone https://github.com/kellyarwine/todo2.git

# Navigate to the project directory
cd todo2

# Install dependencies
npm install

# Start the application
npm start
```

## Usage

### Basic Task Management
1. **Creating Tasks**: Click the "+" button or use the quick-add input
2. **Editing Tasks**: Click on any task to edit its details
3. **Completing Tasks**: Check the checkbox to mark tasks as complete

### Working with Threads
When you have related tasks or need extended discussions:

1. **Create a Thread**: Click "Create Thread" on any task
2. **Add to Thread**: Related tasks and comments will appear in the thread view
3. **Thread Navigation**: Use the thread sidebar to navigate between different discussion threads

### Using Mentions
To collaborate with team members:

1. **Mention Users**: Type `@username` in any task description or comment
2. **Notification**: Mentioned users will receive notifications
3. **Track Mentions**: View all your mentions in the dedicated mentions panel

#### What happens with many mentions?
When a thread accumulates many mentions, Todo2 provides:
- **Smart Grouping**: Related mentions are grouped together
- **Digest Notifications**: Instead of individual notifications, users receive digests
- **Mention Analytics**: Track mention frequency and response patterns
- **Filter Options**: Filter mentions by user, date, or thread
- **Performance Optimization**: Efficient rendering even with hundreds of mentions

## Configuration

Create a `.env` file in the root directory:

```env
# Database configuration
DATABASE_URL=your_database_url

# Notification settings
NOTIFICATION_SERVICE=email
SMTP_HOST=your_smtp_host
SMTP_PORT=587

# Mention settings
MAX_MENTIONS_PER_THREAD=100
MENTION_NOTIFICATION_DELAY=5
```

## API Reference

### Tasks Endpoints
- `GET /api/tasks` - Retrieve all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Threads Endpoints
- `GET /api/threads` - Retrieve all threads
- `POST /api/threads` - Create a new thread
- `GET /api/threads/:id/mentions` - Get mentions in a thread

### Mentions Endpoints
- `GET /api/mentions` - Retrieve user mentions
- `POST /api/mentions` - Create a mention
- `PUT /api/mentions/:id/read` - Mark mention as read

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

Run the test suite:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

## Performance Considerations

Todo2 is optimized for high-volume usage:

- **Efficient Mention Handling**: Implements pagination and lazy loading for threads with many mentions
- **Database Indexing**: Optimized queries for mention lookups and thread operations
- **Caching Strategy**: Redis caching for frequently accessed mentions and threads
- **Rate Limiting**: Prevents mention spam and ensures system stability

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please:
- 📧 Email: support@todo2.example.com
- 🐛 Issues: [GitHub Issues](https://github.com/kellyarwine/todo2/issues)
- 📖 Documentation: [Wiki](https://github.com/kellyarwine/todo2/wiki)

## Roadmap

- [ ] Mobile app development
- [ ] Integration with popular project management tools
- [ ] Advanced mention analytics dashboard
- [ ] Custom notification preferences
- [ ] Thread templates and automation