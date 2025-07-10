# Scriptables

> **Frustrated by rising App Store costs?**  
> **Missing the ability to write automation scripts like you do on your computer?**
> **Enjoy your device’s hardware but want to do more with it?**

With Scriptable, you can take almost complete control of your iOS device through customizable scripts—no app store restrictions or fees involved.

Leverage JavaScript to automate tasks, integrate with APIs, access device features, display analytics, or even streamline processes. Turn your iPhone into a programmable tool that works precisely the way you need it, maybe even more.

Customize and Automate Your iPhone with Scriptable — Shape Your Own Digital World

## What is Scriptable?

Scriptable is a powerful automation application for iOS that enables developers and users to create custom scripts using JavaScript. The app integrates with the native APIs of iOS directly using JavaScript, allowing scripts to run from Siri Shortcuts, present tables, websites, and HTML in Siri, and perform operations on files through integration with the file system and Files.app.

Scriptable was developed by [Simon B. Støvring](https://simonbs.dev/) and serves as a bridge between JavaScript and iOS's native functionality.

## What does Scriptable do?

Scriptable provides it's own automation platform for iOS devices with the following capabilities:

### Core Features

- **JavaScript Execution**: Uses Apple's JavaScriptCore, which supports ECMAScript 6
- **Native iOS API Integration**: Direct access to iOS APIs from JavaScript code
- **External API Integration**: Full HTTP/HTTPS request capabilities for web APIs and services
- **Siri Shortcuts Integration**: Execute scripts through voice commands and shortcuts
- **Widget Support**: Run scripts directly on your Lock Screen and Home Screen using widgets
- **File System Access**: Full integration with iOS file system and Files.app
- **Share Sheet Integration**: Process inputs from share sheets across iOS apps
- **Offline Documentation**: Built-in API documentation available without internet connection

### API Integration Capabilities

Scriptable excels at integrating with external APIs and web services through its robust networking capabilities:

- **HTTP/HTTPS Requests**: Full support for GET, POST, PUT, DELETE, and other HTTP methods with custom headers and request bodies
- **REST API Integration**: Seamless integration with RESTful web services
- **JSON/XML Processing**: Built-in support for parsing and generating JSON and XML data
- **Authentication Support**: Handle various authentication methods including API keys, OAuth, and custom headers
- **Real-time Data**: Fetch live data from weather services, social media APIs, IoT devices, and more
- **Web Scraping**: Parse HTML content from web pages for data extraction

### Script Management

- **Visual Organization**: Assign one of over 800 glyphs and a color to a script to easily identify it in your directory of scripts
- **Quick Access**: Run scripts by 3D touching the app icon
- **File-Based Storage**: Scripts are stored as plain JS files on disk

## How Scriptable Works?

### Architecture

Scriptable operates as a JavaScript runtime environment on iOS, utilizing Apple's [JavaScriptCore](https://developer.apple.com/documentation/javascriptcore) framework. Which provides:

- **A JavaScript Engine**: Full ES6 support for modern JavaScript features
- **Native Bridge**: Direct communication between JavaScript and iOS native APIs
- **Network Layer**: Built-in HTTP client for external API communication
- **Sandboxed Environment**: Secure execution within iOS security constraints
- **Resource Management**: Efficient memory and CPU usage for mobile devices

### How are these scripts executed?

#### Execution Context
Scripts are stored as plain JS files on disk and executed within a controlled JavaScript environment. Unlike web browsers, Scriptable doesn't provide DOM objects or browser-specific APIs. Instead, it offers [iOS-specific objects and functions](https://docs.scriptable.app/).

#### Execution Lifecycle
1. **Script Loading**: JavaScript file is loaded into memory
2. **Environment Setup**: iOS-specific APIs and objects are made available
3. **Execution**: Script runs from top to bottom, with support for async/await
4. **Completion**: Script completion is reported to the system through Script.complete() or automatic detection
5. **Resource Cleanup**: Memory and resources are freed after execution

#### Execution Triggers
Scripts can be executed through various mechanisms:
- **Manual Execution**: Direct launch from the Scriptable app
- **Siri Shortcuts**: Voice activation or automation triggers
- **Widget Runtime**: Automatic execution for Home Screen widgets
- **Share Sheet**: Triggered when content is shared to Scriptable
- **URL Schemes**: External app integration via custom URLs
- **Background Refresh**: Scheduled execution for data updates

### External API Integration

Through its networking capabilities, your scripts can easily integrate with external APIs and web services:

#### HTTP Request System

Scriptable constructs requests that are sent to provided URLs using appropriate load methods. The Request class supports:

- **Multiple HTTP Methods**: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Custom Headers**: Authentication tokens, content types, user agents
- **Request Body**: JSON, form data, raw text, binary data
- **Response Handling**: JSON parsing, text content, binary data, images
- **Error Handling**: Network errors, HTTP status codes, timeout handling

#### Examples of API Integrations

Integrating APIs into a codebase is a common practice today. Many software applications rely on multiple APIs to provide data and functionality that users find valuable.

Scripts on Scriptable follows the same principle.

Common API integration patterns include:

- **Weather Services:** Fetch real-time weather data for widgets and applications.
- **Social Media:** Retrieve metrics like post counts, follower statistics, and recent posts.
- **IoT Devices:** Access sensor data from temperature probes, smart home devices, and other monitoring hardware.
- **Financial Services:** Get up-to-date stock prices, cryptocurrency values, account balances, and debt tracking.
- **Web Services:** Consume any RESTful API that returns data in formats like JSON or XML.


### This seems very similar to [userscripts](https://github.com/bittricky/userscripts), but how do they compare?

#### Similarities
- **JavaScript-Based**: Both use JavaScript for automation
- **API Integration**: Both can make HTTP requests to external services
- **Automation Focus**: Both designed to automate repetitive tasks
- **Customization**: Both allow deep customization of behavior

#### Key Differences

**Execution Environment**:
- **Userscripts**: Run within web browser context with DOM access
- **Scriptable**: Runs in native iOS environment with system API access

**Target Platform**:
- **Userscripts**: Web pages and browser-based content
- **Scriptable**: Native iOS features and mobile-specific functionality

**Integration Points**:
- **Userscripts**: Modify web page behavior, intercept web requests
- **Scriptable**: Integrate with native iOS APIs, run from Siri Shortcuts, present content in iOS interface

**Distribution**:
- **Userscripts**: Installed via browser extensions (Tampermonkey, Greasemonkey)
- **Scriptable**: Scripts stored as plain JS files in the app's file system

**Capabilities**:
- **Userscripts**:
  - DOM manipulation
  - Web page modification
  - Browser storage (localStorage, sessionStorage, cookies)
  - Event handling on web pages
  - Automating repetitive tasks in the browser

- **Scriptable (iOS)**:
  - Sending local notifications
  - Creating and customizing widgets
  - Accessing the file system (reading/writing files)
  - Using device camera and photo library
  - Accessing location services (GPS)
  - Network requests (fetching data from APIs)
  - Running scripts on schedule or via widget interaction

#### Use Case Comparison
**Userscripts are better for**:
- Modifying web page appearance or behavior
- Bypassing website limitations
- Enhancing web-based workflows
- Cross-site data integration

**Scriptable is better for**:
- Mobile device automation
- iOS system integration
- Native app-like experiences
- Offline-capable mobile widgets
- Location-based automation

## Setup Instructions

### Prerequisites
- iOS device running iOS 12.0 or later
- Apple ID for App Store access
- Basic understanding of JavaScript (optional but recommended)

### Installation Process

#### Step 1: Download from App Store
1. Open the App Store on your iOS device
2. Search for "Scriptable"
3. Download and install the app (developed by Simon B. Støvring)
4. Launch the app once installation is complete

#### Step 2: Initial Configuration
1. **Grant Permissions**: Upon first launch, grant necessary permissions for:
   - File system access
   - Location services (if needed)
   - Photos access (if needed)
   - Calendar access (if needed)

2. **Explore Sample Scripts**: The app comes with several example scripts to get you started
   - Review provided examples
   - Run sample scripts to understand functionality
   - Examine code structure and API usage

#### Step 3: Development Environment Setup
1. **Configure Editor**: The editor can be customized to match your preferences
   - Set font size and theme
   - Configure indentation preferences
   - Enable/disable line numbers
   - Set up keyboard shortcuts

2. **Access Documentation**: 
   - Use built-in offline documentation
   - Reference API documentation for available methods
   - Visit the community forum at talk.automators.fm for help and inspiration

### Development Setup

#### Creating Your First Script
1. Open Scriptable app
2. Tap the "+" button to create a new script
3. Choose a name and icon for your script
4. Write your JavaScript code using available APIs
5. Test the script using the play button
6. Save your script

## Deployment Instructions

### Local Deployment (On-Device)

#### Widget Deployment
1. **Create Widget-Compatible Script**:
   - Ensure script returns appropriate data for widget display
   - Handle different widget sizes (small, medium, large)
   - Implement proper error handling

2. **Add to Home Screen**:
   - Long-press on Home Screen
   - Tap "+" to add widget
   - Search for "Scriptable"
   - Select widget size
   - Configure widget to run your script

3. **Widget Configuration**:
   - Set refresh interval
   - Configure widget parameters
   - Test widget functionality

#### Siri Shortcuts Integration
1. **Create Shortcut**:
   - Open Shortcuts app
   - Create new shortcut
   - Add "Run Script" action
   - Select your Scriptable script

2. **Configure Voice Command**:
   - Record phrase for Siri activation
   - Test voice command functionality
   - Set up automation triggers if needed

### Distribution and Sharing

#### Script Sharing
1. **Export Script**:
   - Select script in Scriptable
   - Use share button
   - Choose export format (file or URL)

2. **Import Script**:
   - Receive shared script file
   - Open with Scriptable
   - Review and modify as needed

#### Version Control
1. **File Management**:
   - Scripts stored as .js files
   - Can be managed through Files.app
   - Support for cloud storage integration

2. **Backup Strategy**:
   - Export scripts regularly
   - Store in iCloud or other cloud services
   - Maintain version history manually

## Best Practices

### Script Development
- Use async/await for asynchronous operations
- Implement proper error handling
- Comment code for future reference
- Test scripts thoroughly before deployment

### Performance Optimization
- Minimize API calls where possible
- Cache data when appropriate
- Handle memory management efficiently
- Use appropriate data structures

### Security Considerations
- Validate all user inputs
- Secure API keys and sensitive data
- Follow iOS security guidelines
- Test permissions and access controls

### Maintenance
- Regular script updates for iOS compatibility
- Monitor script performance
- Update deprecated API usage
- Maintain documentation for custom scripts

## Troubleshooting

### Common Issues
- **Script Execution Errors**: Check console output for detailed error messages
- **API Access Problems**: Verify required permissions are granted
- **Widget Display Issues**: Ensure widget-compatible code structure
- **Siri Integration Problems**: Check Shortcuts app configuration

### Community Resources
- Built-in documentation within the app
- GitHub/Gitlab repositories filled with free samples

----------
@author [Mitul Patel](https://github.com/bittricky)
