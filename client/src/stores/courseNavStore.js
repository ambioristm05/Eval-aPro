import { create } from 'zustand';

export const useCourseNavStore = create((set) => ({
  courseId: null,
  moduleId: null,
  classId: null,
  setCourse: (courseId) =>
    set((state) => (state.courseId === courseId ? state : { courseId, moduleId: null, classId: null })),
  setModule: (courseId, moduleId) =>
    set((state) =>
      state.courseId === courseId && state.moduleId === moduleId
        ? state
        : { courseId, moduleId, classId: null }
    ),
  setClass: (courseId, moduleId, classId) => set({ courseId, moduleId, classId }),
}));
