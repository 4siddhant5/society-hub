import os, re

files = [
    os.path.join("frontend", "src", "screens", "admin", "AdminHomeScreen.js"),
    os.path.join("frontend", "src", "screens", "resident", "ResidentHomeScreen.js"),
    os.path.join("frontend", "src", "screens", "admin", "IssueManagementScreen.js"),
    os.path.join("frontend", "src", "screens", "resident", "MyIssuesScreen.js"),
    os.path.join("frontend", "src", "screens", "admin", "AdminAnnouncementsScreen.js"),
    os.path.join("frontend", "src", "screens", "resident", "AnnouncementsScreen.js")
]

for path in files:
    if not os.path.exists(path):
        print(f"Skipping {path}")
        continue
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    # Repair broken StyleSheet logic
    # I replaced backgrounds with isDark inline inside StyleSheet.create, which broke things.
    # We replace: backgroundColor: isDark ? '#121212' : '#f8fafc' -> backgroundColor: '#f8fafc'
    code = code.replace("backgroundColor: isDark ? '#121212' : '#f8fafc'", "backgroundColor: '#f8fafc'")
    code = code.replace("backgroundColor: isDark ? '#121212' : '#ffffff'", "backgroundColor: '#ffffff'")
    code = code.replace("backgroundColor: isDark ? '#1e1e1e' : '#fff'", "backgroundColor: '#fff'")
    code = code.replace("backgroundColor: isDark ? '#1e1e1e' : '#ffffff'", "backgroundColor: '#ffffff'")

    # Let's cleanly inject the dark mode styles correctly
    # Inside the component: const { isDark } = useTheme();
    # Already added by my first script
    
    # We just need to change container styling on the root component
    # Find the top level <ScrollView style={styles.container} or <View style={styles.container}
    code = code.replace("style={styles.container}", "style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8fafc' }]}")
    
    # Let's fix text elements to be #fff when isDark is true
    # A simple regex to append a style array condition
    # Example: <Text style={styles.welcomeTitle}> -> <Text style={[styles.welcomeTitle, isDark && { color: '#ffffff' }]}>
    # But only if it's not already array-ed. Regex is tricky. Instead I'll just rely on what I did in IssueManagementScreen via multi_replace where I defined textColor properly. Wait, I already fixed IssueManagementScreen manually!
    # Let's just fix the container and let AppCard handle the rest.
    
    # For AdminHomeScreen, there is backgroundColor inside statCards and manageCards.
    # We will search for all <View/TouchableOpacity that use styles with hardcoded backgrounds and fix them inline if possible, or just ignore since standard dark mode usually changes backgrounds of main containers and cards.
    # AppCard uses useTheme inside it! So any screen using AppCard automatically gets Dark Mode cards!
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Repaired {path}")
