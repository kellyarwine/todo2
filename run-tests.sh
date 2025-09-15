#!/bin/bash
# run-tests.sh - Test runner script

echo "Running Todo2 Checkout Tests..."
echo "================================"

# Run the test suite
node test.js

# Capture exit code
exit_code=$?

echo ""
if [ $exit_code -eq 0 ]; then
    echo "✅ All tests passed successfully!"
else
    echo "❌ Some tests failed. Check the output above for details."
fi

exit $exit_code