import { Ref } from "vue";
import { useData, useStore } from "../partials/use-store-factory";
import { ref } from "#imports";
import { MultiPurposeLabelOut } from "~/lib/api/types/labels";
import { useUserApi } from "~/composables/api";

const store: Ref<MultiPurposeLabelOut[]> = ref([]);
const loading = ref(false);

export const useLabelData = function () {
  return useData<MultiPurposeLabelOut>({
    groupId: "",
    id: "",
    name: "",
    color: "",
  });
}

export const useLabelStore = function () {
  const api = useUserApi();
  return useStore<MultiPurposeLabelOut>(store, loading, api.multiPurposeLabels);
}
