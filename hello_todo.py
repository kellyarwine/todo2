#!/usr/bin/env python3
"""
Simple Todo Application with Greeting Message Functionality
"""

def greet_user():
    """Display a greeting message to the user"""
    print("hi")
    print("Welcome to Todo2 - Your simple todo manager!")
    print()

def display_todos():
    """Display current todo items"""
    # Read from test file if it exists
    try:
        with open('test', 'r') as f:
            content = f.read().strip()
            if content:
                print("Your current todos:")
                for line in content.split('\n'):
                    if line.strip():
                        print(f"  {line}")
                print()
    except FileNotFoundError:
        print("No todos found. Starting fresh!")
        print()

def main():
    """Main application entry point"""
    greet_user()
    display_todos()
    
    print("Have a great day! 👋")

if __name__ == "__main__":
    main()