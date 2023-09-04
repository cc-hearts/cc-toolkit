import { findPasswordDetail, searchPassword } from '@/model/password'
import { useDescription } from '@/storage/description'
import { GetPromiseReturns } from '@/types/utils'
import { Descriptions, DescriptionsItem, message } from 'ant-design-vue'
import { defineComponent, reactive, watch } from 'vue'
import ViewIcon from '@/icons/view.vue'
import ViewCloseIcon from '@/icons/viewClose.vue'
import { decodeAes } from '@/utils/crypto'
import * as  electron from 'electron'

const { clipboard } = electron

export default defineComponent({
  name: 'passwordDescription',
  setup() {
    const columns = [
      { label: 'title', key: 'title' },
      { label: 'url', key: 'url' },
      { label: 'description', key: 'description' },
      { label: 'username', key: 'username' },
      { label: 'password', key: 'password' },
    ] as const
    const passwordLabel = '******************'
    const { activeDescription } = useDescription()
    const description = reactive({
      data: {} as GetPromiseReturns<typeof findPasswordDetail>,
      password: '',
    })
    async function getData() {
      handleRemovePassword()
      const id = Number(activeDescription.value)
      if (id) {
        const data = await findPasswordDetail(id)
        if (data) description.data = data
      }
    }

    async function handleSearchPassword(id: number) {
      const result = await searchPassword(id)
      if (result && result.password) {
        const code = await decodeAes(result.password)
        if (code) description.password = code
      }
    }
    function handleRemovePassword() {
      description.password = ''
    }
    watch(
      () => activeDescription.value,
      () => {
        getData()
      }
    )


    const handleCopyPassword = async (key: string) => {
      if (key === 'password') {
        const pwd = description.password
        if (!pwd) {
          await handleSearchPassword(description.data!.id)
        }
        clipboard.writeText(description.password)
        message.success('🎉 copy password to clipboard success')
        description.password = pwd
      }
    }

    return () => (
      <div class="min-w-0 p-x-2 overflow-hidden">
        <Descriptions column={1}>
          {activeDescription.value &&
            description.data?.id &&
            columns.map((column) => {
              const key = column.key as (typeof columns)[number]['key']
              return (
                <DescriptionsItem
                  id={column.key}
                  label={column.label}
                  labelStyle={{ width: '100px', 'justify-content': 'end', 'user-select': 'none' }}
                >
                  <div class="overflow-hidden relative whitespace-nowrap text-ellipsis cursor-pointer flex-1 p-r-12">
                    <span onClick={() => handleCopyPassword(key)}>
                      {key === 'password'
                        ? description.password || passwordLabel
                        : description.data![key]}
                    </span>

                    {key === 'password' && (
                      <span class="absolute right-0 select-none">
                        {description.password ? (
                          <span onClick={handleRemovePassword}>
                            <ViewCloseIcon />
                          </span>
                        ) : (
                          <span
                            onClick={() =>
                              handleSearchPassword(description.data!.id)
                            }
                          >
                            <ViewIcon />
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </DescriptionsItem>
              )
            })}
        </Descriptions>
      </div>
    )
  },
})
