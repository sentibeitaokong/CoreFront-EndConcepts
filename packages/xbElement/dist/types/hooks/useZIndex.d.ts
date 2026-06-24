declare const useZIndex: (initialValue?: number) => {
    currentIndex: import('vue').ComputedRef<number>;
    nextIndex: () => number;
    initialZIndex: import('vue').Ref<number, number>;
};
export default useZIndex;
