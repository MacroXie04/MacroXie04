export const education = {
  title: 'education.py',
  icon: 'PY',
  language: 'python',
  content: `# Education Background
# -*- coding: utf-8 -*-

from datetime import date
from typing import List, Dict, Any

class Education:
    def __init__(self):
        self.current_education = {
            'degree': 'Bachelor of Science',
            'major': 'Computer Science & Engineering',
            'university': 'University of California, Merced',
            'location': 'Merced, CA',
            'start_date': '2024-09',
            'expected_graduation': '2028-05',
            'current_gpa': 3.7,
            'status': 'In Progress'
        }
        
        self.coursework = [
            'Data Structures and Algorithms',
            'Object-Oriented Programming',
            'Database Systems',
            'Computer Networks',
            'Software Engineering',
            'Machine Learning Fundamentals',
            'Web Development',
            'Operating Systems'
        ]
        
        self.academic_projects = [
            {
                'name': 'Student Union Website',
                'description': 'Full-stack web application for student services',
                'technologies': ['React', 'Node.js', 'MongoDB'],
                'year': 2024
            },
            {
                'name': 'Computer Vision Project',
                'description': 'Semantic segmentation for aerial imagery',
                'technologies': ['Python', 'OpenCV', 'TensorFlow'],
                'year': 2024
            },
            {
                'name': 'Financial Analytics Dashboard',
                'description': 'Interactive dashboard for market analysis',
                'technologies': ['Python', 'Streamlit', 'Plotly'],
                'year': 2023
            }
        ]
    
    def get_graduation_progress(self) -> float:
        start = date(2024, 9, 1)
        expected_end = date(2028, 5, 1)
        current = date.today()
        
        total_days = (expected_end - start).days
        elapsed_days = (current - start).days
        
        return min(100, max(0, (elapsed_days / total_days) * 100))
    
    def get_current_semester(self) -> str:
        current = date.today()
        year = current.year
        
        if 8 <= current.month <= 12:
            return f"Fall {year}"
        elif 1 <= current.month <= 5:
            return f"Spring {year}"
        else:
            return f"Summer {year}"

# Initialize education instance
education = Education()

print(f"Current semester: {education.get_current_semester()}")
print(f"Graduation progress: {education.get_graduation_progress():.1f}%")`
}; 